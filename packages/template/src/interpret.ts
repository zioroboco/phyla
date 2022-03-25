import * as E from "fp-ts/Either"

export function interpret (
  template: string,
  variables: { [key: string]: string } = {}
): E.Either<Error[], string> {
  const errors: Error[] = []

  const definitions = Object.keys(variables).map(
    key => `let ${key} = ${JSON.stringify(variables[key])}`
  )

  const rendered = template.replaceAll(/{{[ ]*(.+?)[ ]*}}/g, (_, capture) => {
    try {
      return new Function(
        [...definitions, `return ${capture}`].join(";")
      )()
    } catch (e) {
      errors.push(e instanceof Error ? e : new Error(String(e)))
      return ""
    }
  })

  if (errors.length > 0) {
    return E.left(errors)
  } else {
    return E.right(rendered)
  }
}
