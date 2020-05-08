import { ux, Question } from '@cto.ai/sdk'
import { PromptAnswer } from '../types'
import { AWS_INSTANCE_SIZES } from '../constants'

const { magenta, red, green } = ux.colors

export const showPreCreateMessage = async(region: string, totalEC2required: number) => {
  const infoLines = [
    `\nℹ️  In order to successfully create an EKS cluster in ${green(region)}, you need to have availability for:\n`,
    `  ∙ ${green('1')} VPC`,
    `  ∙ ${green(totalEC2required.toString())} EC2 instance(s)`,
    `  ∙ ${green('3')} Elastic IPs`,
    `  ∙ ${green('1')} S3 bucket\n`,
  ]

  await ux.print(infoLines.join(`\n`))
  return
}

export const clusterNamePrompt: Question<PromptAnswer>[] = [
  {
    type: 'input',
    name: 'clusterName',
    message: '\nPlease enter a cluster name',
  },
]

export const confirmPrompt: Question<PromptAnswer>[] = [
  {
    type: 'input',
    name: 'confirm',
    default: 'no',
    message: `\nPlease enter \`${green('yes')}\` to create the cluster, or \`${red('no')}\` to exit`,
  },
]

export const confirmCreatePrompt: Question<PromptAnswer>[] = [
  {
    type: 'input',
    name: 'confirmCreate',
    default: 'no',
    message: `\nPlease enter \`${green('yes')}\` to continue and create the cluster (⏱  ~15 minutes), or \`${red('no')}\` to exit`,
  },
]

export const workerPrompts: Question<PromptAnswer>[] | Question<PromptAnswer>[] = [
  {
    type: 'autocomplete',
    name: 'instance_type',
    default: 't2.micro',
    message: '\nPlease select the size of the nodes in this group:',
    choices: AWS_INSTANCE_SIZES
  },
  {
    type: 'confirm',
    name: 'enable_monitoring',
    default: false,
    message: '\nWould you like to enable detailed monitoring for the instances in this group (incurs additional costs)?',
  },
  {
    type: 'confirm',
    name: 'autoscaling_enabled',
    default: true,
    message: '\nWould you like to enable autoscaling for this group?',
  },
]

export const desiredNodesPrompt: Question = {
  type: 'number',
  name: 'asg_desired_capacity',
  default: 1,
  message: `\nPlease enter the number of nodes desired:`
}

export const minNodesPrompt: Question = {
  type: 'number',
  name: 'asg_min_size',
  default: 1,
  message: `\n${magenta('Please select a minimum & maximum number of worker nodes for the autoscaler:\n')} \nMinimum number of nodes:`,
}

export const maxNodesPrompt: Question = {
  type: 'number',
  name: 'asg_max_size',
  default: 3,
  message: `\nMaximum number of nodes:`,
}

export const deleteClusterPrompts: Question<PromptAnswer>[] = [
  {
    type: 'input',
    name: 'clusterNameToDestroy',
    message: `\n🔥  Please enter the name of the cluster you would like to destroy \n${red('⚠️  Warning: this WILL initiate cluster destruction (⏱  ~15 minutes)')}`,
  },
]
