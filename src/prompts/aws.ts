import { Question } from '@cto.ai/sdk'
import { EKS_CONTROL_PLANE_LOG_TYPES } from '../constants'

export const awsProfileNamePrompt: Question = {
  type: 'input',
  name: 'AWS_PROFILE',
  message: '\nPlease enter a name for your AWS credentials profile',
}
export const awsProfileNameValidate = (input: string) => {
  const hasSpaces = /\s/g.test(input)
  return !!input && input.trim() && !hasSpaces
}

export const awsDefaultRegionPrompt = (action, regions: string[]): Question => {
  return {
    type: 'autocomplete',
    name: 'AWS_DEFAULT_REGION',
    message: `Please select the region you want to ${action} a cluster in`,
    choices: regions,
  }
}

export const confirmAddUsersPrompt: Question = {
  type: 'confirm',
  name: 'confirmAddUsers',
  message: '\nWould you like to grant additional users access to your cluster?',
  default: false,
}

export const getAdditionalUsersPrompt = (users): Question => {
  return {
    type: 'checkbox',
    name: 'users',
    message:
      '\nSelect any additional users you would like to grant access to your cluster',
    choices: users,
  }
}

export const confirmEnableEKSControlPlaneLogs: Question = {
  type: 'confirm',
  name: 'confirmCPLogs',
  message:
    '\nWould you like to enable EKS Control Plane Logging (incurs additional costs)?',
  default: false,
}

export const logTypesPrompt: Question = {
  type: 'checkbox',
  name: 'logTypes',
  message:
    '\nSelect which cluster control plane log types you would like enabled',
  choices: EKS_CONTROL_PLANE_LOG_TYPES,
}

export const confirmEnableContainerInsightsPrompt: Question = {
  type: 'confirm',
  name: 'enableContainerInsights',
  message:
    '\nWould you like to enable EKS Container Insights Logging (incurs additional costs)?',
  default: false,
}
