import { sdk, ux } from '@cto.ai/sdk'
import { spawn } from 'child_process'
import {
  track,
  pExec,
  confirmEKSClusterDeleted,
  createS3Bucket,
  deleteS3Bucket,
  startSpinner,
  succeedSpinner,
  failSpinner,
} from '../utils'
import { TfConfigs, AWSCreds } from '../types'
import {
  VARIABLE_FILENAME,
  CONFIGS_DIR,
  TF_CREATE_COMPLETE,
  TF_DESTROY_COMPLETE,
  CREATE_STATES,
  DESTROY_STATES,
  TF_RESOURCES,
} from '../constants'
import { pExecWithLogs } from './pExec';

const { bold, red, green, reset: { dim } } = ux.colors

export class Terraform {
  awsCreds: AWSCreds;
  accountNumber: string;
  clusterName: string;
  logTypes: string;
  region: string;
  profile: string;
  enableContainerInsights: boolean;
  users: string[];
  constructor({ awsCreds, accountNumber, clusterName, region, profile, logTypes, enableContainerInsights, users = [] }) {
    this.awsCreds = awsCreds
    this.accountNumber = accountNumber
    this.clusterName = clusterName
    this.logTypes = logTypes
    this.region = region
    this.profile = profile // AWS profile name in ~/.aws/credentials
    this.enableContainerInsights = enableContainerInsights
    this.users = users  // users w access to cluster
  }

  // Sanitize cluster name to ensure they follow S3 bucket name restrictions
  get bucketName() {
    const sanitized = this.clusterName.toLowerCase().replace(/[_\.]/g, '-').slice(0,58)
    return `${sanitized}-eks`
  }

  get s3Policy() {
    return {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": { "AWS": this.accountNumber },
          "Action": "s3:ListBucket",
          "Resource": `arn:aws:s3:::${this.bucketName}`
        },
        {
          "Effect": "Allow",
          "Principal": { "AWS": this.accountNumber },
          "Action": ["s3:GetObject", "s3:PutObject"],
          "Resource": `arn:aws:s3:::${this.bucketName}/cluster/terraform.tfstate`
        }
      ]
    }
  }

  async createStateS3Bucket() {
    const { bucketName, awsCreds } = this
    await createS3Bucket(awsCreds, bucketName, this.s3Policy)
  }

  async deleteStateS3Bucket() {
    const { bucketName, awsCreds } = this
    await deleteS3Bucket(awsCreds, bucketName)
  }

  // Configure terraform to write to S3
  // TODO: state locking
  async configure() {
    const backendConfig = `terraform {\n
      backend \\"s3\\" {\n
        bucket = \\"${this.bucketName}\\" \n
        key = \\"cluster/terraform.tfstate\\" \n
        region = \\"${this.region}\\" \n
        profile = \\"${this.profile}\\"
      }\n
    }`

    await pExec(`rm -rf .terraform && echo "${backendConfig}" > terraform-init.tf`, {
      cwd: CONFIGS_DIR,
    })
  }

  // TODO: restore spinners once SDK can support multiple spinners
  async showProgress({ msg, resource, states }) {
    if (msg.includes(resource)) {
      const resourceName = TF_RESOURCES[resource]
      if (msg.includes(states.wip)) {
        // Show some progress but only every 1 min
        if (msg.includes('m0s elapsed')) {
          const textInBrackets = msg.split('... ')[1]
          const hasId = textInBrackets.includes('id=')
          const timeElapsed = hasId ? textInBrackets.split(', ')[1].replace(/[\[\]]/g, '') : textInBrackets.replace(/[\[\]]/g, '')
          await ux.print(`⏳  ${resourceName} - ${states.start} ${timeElapsed}`)
        }
        return
      }
      if (msg.includes(states.start)) {
        await startSpinner(`${resourceName} - ${states.start}`)
      }
      if (msg.includes(states.end)) {
        await succeedSpinner(`${resourceName} - ${states.end}`)
      }
    }
    return
  }

  async init() {
    await startSpinner('Initialization - Started')
    const init = await pExec(`AWS_PROFILE=${this.profile} terraform init`, { cwd: CONFIGS_DIR })
    if (init.stdout) {
      await succeedSpinner('Initialization - Completed')
    }
    if (init.stderr) {
      await failSpinner('Initialization - Failed')
      await ux.print(init.stderr)
    }
  }

  async pullState() {
    await startSpinner('Updating info about cluster resources')
    const pull = await pExec(`AWS_PROFILE=${this.profile} terraform state pull`, { cwd: CONFIGS_DIR })
    if (pull.stdout) {
      await succeedSpinner('Info about cluster resources updated')
    }
    if (pull.stderr) {
      await failSpinner('Failed to update info about cluster resources')
      await ux.print(pull.stderr)
    }
  }

  async variableFile(settingsJson) {
    await pExec(`echo "${settingsJson}" > ${VARIABLE_FILENAME}`, {
      cwd: CONFIGS_DIR,
    })
    await track({
      event: 'Variable file created',
      settings: settingsJson,
      clusterName: this.clusterName,
    })
  }

  async apply({ settingsJson, onComplete }: TfConfigs) {
    await this.variableFile(settingsJson)
    const plan = spawn(`AWS_PROFILE=${this.profile} terraform apply --var-file=${VARIABLE_FILENAME} -auto-approve -no-color`, {
      shell: true,
      cwd: CONFIGS_DIR,
    })

    await plan.stdout.on('data', async message => {
      const msg = message.toString()
      // await ux.print(msg)

      const progressIndicators = Object.keys(TF_RESOURCES).map(resource => {
        try {
          return this.showProgress({ msg, resource, states: CREATE_STATES })
        } catch (err) {
          return err
        }
      })
      try {
        await Promise.all(progressIndicators)
      } catch (err) {
        console.log('ERROR:', err)
      }

      if (msg.includes(TF_CREATE_COMPLETE)) {
        await succeedSpinner('Cluster - Creation completed')
        await onComplete()
      }
    })

    // Rollback if error
    await plan.stderr.on('data', async message => {
      await ux.print(message.toString())
      await failSpinner('Cluster - Creation failed. Rolling back!')
      await this.destroy({ settingsJson })
    })
  }

  async destroy({ settingsJson }) {
    await this.variableFile(settingsJson)
    await startSpinner('Cluster - Destroying resources')
    const destroy = spawn(`AWS_PROFILE=${this.profile} terraform destroy --var-file=${VARIABLE_FILENAME} -auto-approve -no-color`, {
      cwd: CONFIGS_DIR,
      shell: true,
    })

    await destroy.stdout.on('data', async message => {
      const msg = message.toString()
      // await ux.print(msg)

      const progressIndicators = Object.keys(TF_RESOURCES).map(resource => {
        return this.showProgress({ msg, resource, states: DESTROY_STATES })
      })
      await Promise.all(progressIndicators)

      if (msg.includes(TF_DESTROY_COMPLETE) && await confirmEKSClusterDeleted(this.awsCreds, this.clusterName)) {
        await this.deleteStateS3Bucket()
        await track({ event: 'Cluster destruction complete', action: 'destroy', clusterName: this.clusterName })
        await succeedSpinner('Cluster - Destruction completed')
      }
    })

    await destroy.stderr.on('data', async message => {
      const msg = message.toString()
      await ux.print(msg)
      await failSpinner('Cluster - Destruction failed. Please check and clean up resources manually!')
      destroy.kill()
    })
  }
}
