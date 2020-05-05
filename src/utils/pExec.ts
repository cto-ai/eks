import { promisify } from 'util'
import { exec } from 'child_process'
import { sdk, ux } from '@cto.ai/sdk'

const { reset: { bold, magenta } } = ux.colors

export const pExec = promisify(exec)

export const pExecWithLogs = async (command: string, options?: object) => {
  await ux.print(
    bold(`Running ${magenta(command)}`),
  )

  const { stdout, stderr } = await pExec(command, options)
  if (stdout) await ux.print(`${stdout}`)
  if (stderr) await ux.print(`${stderr}`)

  return { stdout, stderr }
}
