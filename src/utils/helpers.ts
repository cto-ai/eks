import { ux, sdk } from '@cto.ai/sdk'
import { track } from '.'

const { red } = ux.colors

// Validate user input -if invalid input, print an error message and re-display the prompt
export const validatePrompt = async ({ prompt, error, validate, validateOptions = {} }) => {
  let input: any = await ux.prompt(prompt)
  const value = Object.values(input)[0]
  const isInputValid = await validate({ value, ...validateOptions })

  if (!isInputValid) {
    await ux.print(red(error))
    input = await validatePrompt({ prompt, error, validate, validateOptions })
  }

  return input
}

export const invalidParam = async ({ name, param, validOptions }) => {
  await ux.print(`\n${red(`'${param}' is an invalid ${name} name! The valid options are: ${validOptions.join(', ')}`)}`);

  await track({ event: `invalid ${name} param ${param}` })
}
