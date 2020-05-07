import { ux, sdk } from '@cto.ai/sdk'

import { pExec } from './'
import { AWSCreds } from '../types'
import {
  CLUSTER_ACTIVE_DELETED,
  CONFIGS_DIR,
  AWS_REGIONS,
  RESOURCE_LIMITS,
} from '../constants'
import {
  confirmAddUsersPrompt,
  getAdditionalUsersPrompt,
  awsAccountNumberPrompt,
  awsAccountNumberValidate,
  awsDefaultRegionPrompt,
  awsAccessKeyIDPrompt,
  awsSecretAccessKeyPrompt,
  awsAccessKeyIDValidate,
  awsSecretAccessKeyValidate,
} from '../prompts'
import {
  startSpinner,
  succeedSpinner,
  failSpinner
} from '../utils'

export const getCurrentUser = async (awsCreds: AWSCreds) => {
  try {
    const { stdout } = await pExec(`aws sts get-caller-identity`,)
    return JSON.parse(`${stdout}`)
  } catch (error) {
    await ux.print(
      `Failed to get information associated with AWS profile '${awsCreds.AWS_PROFILE}': ${error}`,
    )
  }
}

export const grantUserAccess = async (awsCreds: AWSCreds) => {
  try {
    const currUser = await getCurrentUser(awsCreds)
    const { stdout } = await pExec(`aws iam list-users --no-paginate`)
    const { Users } = JSON.parse(`${stdout}`)
    const usersList = Users.filter(user => user.Arn !== currUser.Arn) // exclude current user
      .map(user => {
        return user.UserName
      })

    const { confirmAddUsers } = await ux.prompt(confirmAddUsersPrompt)
    if (confirmAddUsers) {
      const { users } = await ux.prompt(getAdditionalUsersPrompt(usersList))
      return users
    }
    return
  } catch (error) {
    await ux.print(`Failed to get list of users on your team: ${error}`)
  }
}

export const listClusters = async () => {
  try {
    const { stdout } = await pExec(`aws eks list-clusters`)
    const { clusters } = JSON.parse(`${stdout}`)
    return clusters
  } catch (error) {
    await ux.print(`Unable to retrieve list of EKS clusters: ${error}`)
  }
}

const getRegionIfHasEKS = async (region: string, accessKey: string, secretKey: string) => {
  const { stdout } = await pExec(`AWS_ACCESS_KEY_ID='${accessKey}' AWS_SECRET_ACCESS_KEY='${secretKey}' aws eks list-clusters --region '${region}'`)
  const { clusters } = JSON.parse(stdout)
  if (clusters.length > 0) {
    return region
  }
  return null
}

export const listRegionsContainingClusters = async ({ action, accessKey, secretKey }) => {
  if (action === 'create') return AWS_REGIONS

  try {
    await startSpinner('Retrieving list of regions with existing EKS clusters...')
    
    const regions: string[] = []
    const getAllRegionsWithEKSClusters = AWS_REGIONS.reduce(async (previousPromise, region) => {
      const regionMatch = await previousPromise
      if (regionMatch !== null) {
        regions.push(regionMatch)
      }
      return getRegionIfHasEKS(region, accessKey, secretKey)
    }, Promise.resolve(null))
  
    await getAllRegionsWithEKSClusters
    await succeedSpinner('Successfully retrieved the list of regions with existing EKS clusters.')

    return regions.filter(region => !!region)
  } catch (error) {
    failSpinner('Failed to retrieve the list of regions with existing EKS clusters; please select from the list of all regions.')
    await ux.print(`Unable to retrieve list of EKS clusters: ${error}`)
    return AWS_REGIONS
  }
}

export const authenticateAWS = async ({ action }): Promise<AWSCreds> => {
  const AWS_PROFILE = 'default'

  const { AWS_ACCOUNT_NUMBER } = await sdk.getSecret('AWS_ACCOUNT_NUMBER')
  const { AWS_ACCESS_KEY_ID } = await sdk.getSecret('AWS_ACCESS_KEY_ID')
  const { AWS_SECRET_ACCESS_KEY } = await sdk.getSecret('AWS_SECRET_ACCESS_KEY')

  const regions = await listRegionsContainingClusters({ action, accessKey: AWS_ACCESS_KEY_ID, secretKey: AWS_SECRET_ACCESS_KEY })

  const { AWS_DEFAULT_REGION } = await ux.prompt(
    awsDefaultRegionPrompt(action, regions)
  )

  await setupAWSProfile(AWS_PROFILE, AWS_DEFAULT_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)

  return {
    AWS_PROFILE: AWS_PROFILE.trim(),
    AWS_DEFAULT_REGION,
    AWS_ACCOUNT_NUMBER,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
  }
}

// See: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html
export const setupAWSProfile = async (
  profile: string,
  region: string,
  accessKeyId: string,
  secretAccessKey: string,
) => {
  const setRegionCmd = `aws configure --profile '${profile}' set region '${region}'`
  const setAccessKeyIdCmd = `aws configure --profile '${profile}' set aws_access_key_id '${accessKeyId}'`
  const setSecretAccessKeyCmd = `aws configure --profile '${profile}' set aws_secret_access_key '${secretAccessKey}'`
  
  await pExec (`${setRegionCmd} && ${setAccessKeyIdCmd} && ${setSecretAccessKeyCmd}`)

  return
}

// TODO: EC2 check should not consider terminated instances
export const hasResourceAvailable = async ({ awsCreds, type, needed = 0 }) => {
  const resource = RESOURCE_LIMITS[type]
  try {
    await startSpinner(`Checking if you have availability for \`${needed ? needed: resource.needed} ${resource.name}(s)\` in \`${awsCreds.AWS_DEFAULT_REGION}\`...`)
    const { stdout: count } = await pExec(resource.command)

    const currentCount = parseInt(count)
    const numAvailable = resource.limit - currentCount
    const numNeeded = !!needed ? needed : resource.needed
    if (numNeeded <= numAvailable) {
      await succeedSpinner(`You have \`${currentCount} ${resource.name}(s)\` in this region. You're good to go!`)
      return true
    }
    await failSpinner(`You already hit the default max no. of \`${resource.name}s\` in your region.`)
    return false
  } catch (error) {
    await ux.print(`Failed to verify \`${resource.name}\` availability`)
  }
}

export const checkResourcesAvailability = async (awsCreds: AWSCreds, totalEC2required: number) => {
  return (
    (await hasResourceAvailable({ awsCreds, type: 'vpc' })) &&
    (await hasResourceAvailable({ awsCreds, type: 'ec2', needed: totalEC2required })) &&
    (await hasResourceAvailable({ awsCreds, type: 'eip' }))
  )
}

export const confirmEKSClusterDeleted = async (awsCreds: AWSCreds, clusterName: string) => {
  await startSpinner(`Checking that the cluster was correctly deleted...\n`)
  try {
    const { stdout: clusterStatus } = await pExec(`aws eks describe-cluster --name ${clusterName} --query 'cluster.[status]' --output text`)
    await succeedSpinner(`Cluster successfully deleted!`)
    return `${clusterStatus}`.trim() === CLUSTER_ACTIVE_DELETED
  } catch (err) {
    if (err.message && err.message.includes('No cluster found')) {
      await succeedSpinner(`Cluster successfully deleted!`)
      return true
    }
    await failSpinner(`Failed to confirm successful deletion.`)
    return false
  }
}

// Create S3 bucket to store Terraform state & configure terraform
export const createS3Bucket = async (awsCreds: AWSCreds, bucketName: string, s3Policy: object) => {
  const { AWS_DEFAULT_REGION } = awsCreds
  try {
    // Don't use LocationConstraint argument if region = us-east-1 - will throw an error
    let createBucket = `aws s3api create-bucket --bucket ${bucketName}`
    if (AWS_DEFAULT_REGION !== 'us-east-1') {
      createBucket = createBucket.concat(` --create-bucket-configuration LocationConstraint=${AWS_DEFAULT_REGION}`)
    }
    await pExec(createBucket)

    // Create S3 bucket & policy for the bucket
    const s3PolicyJson = JSON.stringify(s3Policy).replace(/\"/g, '\\"')

    await pExec(`echo "${s3PolicyJson}" > s3-policy.json`, { cwd: CONFIGS_DIR })

    await pExec(`aws s3api wait bucket-exists --bucket ${bucketName}`)
    await pExec(
      `aws s3api put-bucket-policy --bucket ${bucketName} --policy file://s3-policy.json`,
      { cwd: CONFIGS_DIR },
    )
  } catch (error) {
    await ux.print(`Error creating S3 bucket ${bucketName}: ${error}`,)
  }
}

export const deleteS3Bucket = async (awsCreds: AWSCreds, bucketName: string) => {
  try {
    // Need to empty bucket first before you can delete it
    await pExec(`aws s3 rm s3://${bucketName} --recursive`)
    await pExec(`aws s3api delete-bucket --bucket ${bucketName}`)
  } catch (error) {
    await ux.print(`Error deleting S3 bucket ${bucketName}: ${error}`)
  }
}
