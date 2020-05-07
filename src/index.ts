import { sdk, ux } from '@cto.ai/sdk'
import yargs from 'yargs'
import {
  track,
  checkResourcesAvailability,
  grantUserAccess,
  listClusters,
  authenticateAWS,
  invalidParam,
  validatePrompt,
  Cluster,
} from './utils'
import {
  confirmCreatePrompt,
  showPrerunMessage,
  selectAction,
  clusterNamePrompt,
  isClusterNameValid,
  isClusterNameToDeleteValid,
  workerPrompts,
  desiredNodesPrompt,
  minNodesPrompt,
  maxNodesPrompt,
  deleteClusterPrompts,
  showPreCreateMessage,
  confirmEnableEKSControlPlaneLogs,
  logTypesPrompt,
  confirmEnableContainerInsightsPrompt,
  valueExists,
  isGreaterThanZero,
  validateMaxNodes,
} from './prompts'
import { workerSettings, DefaultWorkerSettings } from './types'
import { ACTION_ARGS, CLUSTER_ACTIONS } from './constants'

const { green, red, bold, bgRed } = ux.colors

async function getClusterSettings(awsCreds) {
  const { AWS_PROFILE } = awsCreds
  const users = await grantUserAccess(awsCreds)

  const { clusterName } = await validatePrompt({
    prompt: clusterNamePrompt,
    validate: isClusterNameValid,
    validateOptions: { awsCreds },
    error: 'A cluster with the same name already exists in this region--please choose a different name',
  })

  await ux.print(bold("\nLet's configure your worker group!"))
  const workerSettings: workerSettings[] = []

  // Note: left as a loop to acommodate multiple worker groups in the future
  for (var i = 0; i < 1; i++) {
    const defaultWorkerSettings: DefaultWorkerSettings = {
      asg_desired_capacity: 1,
      asg_min_size: 1,
      asg_max_size: 3, // default setting in the EKS module
    }
    let workerInput: any = await ux.prompt(workerPrompts)

    if (workerInput.autoscaling_enabled) {
      const { asg_min_size } = await validatePrompt({
        prompt: minNodesPrompt,
        validate: isGreaterThanZero,
        error: 'Minimum number must be greater than 0',
      })

      const { asg_max_size } = await validatePrompt({
        prompt: maxNodesPrompt,
        validate: validateMaxNodes,
        validateOptions: { minNodes: asg_min_size },
        error: 'The maximum number of nodes must be greater than the minumum number',
      })

      workerInput = Object.assign(workerInput, { 
        autoscaling_enabled: true,
        asg_min_size: asg_min_size, 
        asg_max_size: asg_max_size, 
        asg_desired_capacity: asg_min_size
      })
    } else {
      const { asg_desired_capacity } = await validatePrompt({
        prompt: desiredNodesPrompt,
        validate: isGreaterThanZero,
        error: 'Desired number of nodes must be greater than 0',
      })
      workerInput = Object.assign(workerInput, { 
        autoscaling_enabled: false,
        asg_desired_capacity: parseInt(asg_desired_capacity) 
      })
    }

    const settings = Object.assign(defaultWorkerSettings as workerSettings, workerInput)
    workerSettings.push(settings)
  }

  const { confirmCPLogs } = await ux.prompt(confirmEnableEKSControlPlaneLogs)
  let logTypes = []
  if (confirmCPLogs) {
    const cpLogsRes: any = await ux.prompt(logTypesPrompt)
    logTypes = cpLogsRes.logTypes
  }

  const { enableContainerInsights } = await ux.prompt(confirmEnableContainerInsightsPrompt)

  return {
    profile: awsCreds.AWS_PROFILE,
    accountNumber: awsCreds.AWS_ACCOUNT_NUMBER,
    aws: {
      accessKey: awsCreds.AWS_ACCESS_KEY_ID,
      secretKey: awsCreds.AWS_SECRET_ACCESS_KEY,
    },
    region: awsCreds.AWS_DEFAULT_REGION,
    clusterName,
    users,
    workers: workerSettings,
    logTypes,
    enableContainerInsights
  }
}

async function main() {
  await showPrerunMessage()

  const actionPrompt: { action: string } = await ux.prompt(selectAction)
  const action = CLUSTER_ACTIONS[actionPrompt.action]
  await track({ event: `Op action '${action}' selected` })

  // SETUP AWS CREDENTIALS
  const awsCreds = await authenticateAWS({ action })

  switch (action) {
    case 'create': {
      const clusterSettings = await getClusterSettings(awsCreds)
      const { workers } = clusterSettings
      const { AWS_DEFAULT_REGION } = awsCreds

      const totalEC2required = workers.reduce((sum, group) => {
        const maxSize = group.autoscaling_enabled && group.asg_max_size ? group.asg_max_size : group.asg_desired_capacity
        return sum + maxSize
      }, 0)
      showPreCreateMessage(awsCreds.AWS_DEFAULT_REGION, totalEC2required)

      const hasAvailability = await checkResourcesAvailability(awsCreds, totalEC2required)
      if (!hasAvailability) {
        await ux.print(red(`\n❗️ Looks like you don't have enough resources available in this region to create an EKS cluster.\nUnless your region is configured with different limits than the default ones, we advise using a different region.`))
        const { confirmCreate } = await ux.prompt(confirmCreatePrompt)
        await track({ event: 'Insufficient AWS resources', action, region: AWS_DEFAULT_REGION, clusterSettings, confirmCreate })
        if (confirmCreate !== 'yes') return
      }

      await track({ event: 'Confirm cluster creation', action, ...clusterSettings })

      const cluster = new Cluster({ settings: clusterSettings, awsCreds })
      await cluster.create()
      break
    }
    case 'destroy': {
      await ux.print(bold(
        bgRed('\n⚠️   Destroying a cluster is irreversible! Please proceed with caution \n')
      ))

      const clusters = await listClusters()
      const { AWS_DEFAULT_REGION } = awsCreds
      await ux.print(`\n💻  Here is a list of clusters you have created in \`${green(bold(AWS_DEFAULT_REGION))}\`: `)
      await ux.print(` ∙ ${clusters.join('\n ∙ ')}`)

      const { clusterNameToDestroy } = await validatePrompt({
        prompt: deleteClusterPrompts,
        error: 'Please enter a valid existing cluster name',
        validate: isClusterNameToDeleteValid,
        validateOptions: { awsCreds },
      })
      ux.print('\n')

      const settings = {
        clusterName: clusterNameToDestroy,
        profile: awsCreds.AWS_PROFILE,
        accountNumber: awsCreds.AWS_ACCOUNT_NUMBER,
        region: awsCreds.AWS_DEFAULT_REGION,
        aws: {
          accessKey: awsCreds.AWS_ACCESS_KEY_ID,
          secretKey: awsCreds.AWS_SECRET_ACCESS_KEY,
        },
      }
      await track({ event: 'Confirm cluster destruction', action, ...settings })
      const cluster = new Cluster({ settings, awsCreds })
      await cluster.destroy()
      break
    }
    default:
      invalidParam({ name: 'action', param: action, validOptions: ACTION_ARGS })
  }
}

main()
