import { sdk, ux } from '@cto.ai/sdk'

 // TODO: restore when ux.spinner supports multiple instances in parallel
export const startSpinner = async (text: string) => {
  // if (sdk.getInterfaceType() === 'terminal') {
  //   ux.spinner.start(`⏳  ${text}`)
  // }
  return await ux.print(`⏳  ${text}`)
}

export const succeedSpinner = async (text: string) => {
  // if (sdk.getInterfaceType() === 'terminal') {
  //   ux.spinner.start(`✅  ${ux.colors.green(text)}`)
  // }
  return await ux.print(`✅  ${ux.colors.green(text)}`)
}

export const failSpinner = async (text:string) => {
  // if (sdk.getInterfaceType() === 'terminal') {
  //   ux.spinner.start(`❌  ${ux.colors.red(text)}`)
  // }
  return await ux.print(`❌  ${ux.colors.red(text)}`)
}