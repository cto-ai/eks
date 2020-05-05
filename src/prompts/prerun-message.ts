import { ux, sdk, Question } from '@cto.ai/sdk'
import { PromptAnswer } from '../types'
import { CLUSTER_ACTIONS } from '../constants'

// Generated with: https://psfonttk.com/big-text-generator/
const logo = `
█▀▀ █░█ █▀▀   █▀▀█ █▀▀█
█▀▀ █▀▄ ▀▀█   █░░█ █░░█
▀▀▀ ▀░▀ ▀▀▀   ▀▀▀▀ █▀▀▀
`

export const showPrerunMessage = async () => {
  const greetingLines = [
    `\n👋  Hello, welcome to the EKS Op! If you have any questions be sure to reach out to the CTO.ai team, we're always happy to help!\n`,
    `ℹ️  This Op requires some setup. Here's what you'll need:\n`,
    `  ∙ AWS Account Number`,
    `  ∙ AWS Access Key ID`,
    `  ∙ AWS Secret Access Key`,
    `  ∙ SSH key pair (to connect to the cluster once created)\n`,
  ]

  await ux.print(logo)
  await ux.print(greetingLines.join(`\n`))
  return
}

export const selectAction: Question<PromptAnswer>[] = [
  {
    type: 'list',
    name: 'action',
    message: '\nWhat would you like to do?',
    choices: Object.keys(CLUSTER_ACTIONS),
  }
]
