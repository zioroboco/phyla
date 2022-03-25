import * as E from "fp-ts/Either"
import { inspect } from "util"

class TemplateError extends Error {
  constructor (public message: string) {
    super(message)
    this.name = "TemplateError"
  }
}

export function interpret (
  template: string,
  variables: { [key: string]: string | string[] } = {}
): E.Either<Error[], string> {
  const errors: Error[] = []

  const definitions = Object.keys(variables).map(
    key => `let ${key} = ${JSON.stringify(variables[key])}`
  )

  const rendered = template.replaceAll(
    /{{[ ]*(\.{3})?(.+?)[ ]*}}/g,
    (_, spread, expression) => {
      try {
        const evaluated = new Function(
          [...definitions, `return ${expression}`].join(";")
        )()

        if (spread) {
          if (!Array.isArray(evaluated)) {
            throw new TemplateError(
              `expected array result when evaluating ${inspect(expression)}` +
                ` but expression returned ${inspect(evaluated)}`
            )
          }
          return evaluated.join("\n")
        }

        return evaluated
      } catch (e) {
        errors.push(e instanceof Error ? e : new Error(String(e)))
        return ""
      }
    }
  )

  if (errors.length > 0) {
    return E.left(errors)
  } else {
    return E.right(rendered)
  }
}
