import * as E from "fp-ts/Either"
import { inspect } from "util"

class TemplateError extends Error {
  constructor (public message: string) {
    super(message)
    this.name = "TemplateError"
  }
}

const transformFallback = (tag: string, value: string) => {
  throw new TemplateError(
    `Encountered tag ${inspect(tag)} with no transform function`
  )
}

export function interpret (
  template: string,
  options?: Partial<{
    variables: { [key: string]: string | string[] },
    separator: string,
    transform: (tag: string, value: string) => string
  }>
): E.Either<Error[], string> {
  const transform = options?.transform ?? transformFallback
  const variables = { ...options?.variables }
  const errors: Error[] = []

  const definitions = Object.keys(variables).map(
    key => `let ${key} = ${JSON.stringify(variables[key])}`
  )

  const rendered = template.replaceAll(
    // Match pairs of double-curlies (unless escaped), capturing the inner
    // string (and optional tag, e.g. `slot:`) and any preceeding whitespace.
    // e.g. `{{ stuff }}`, `{{ ...stuff.map(s => ...) }}`, `{{ slot: stuff }}`
    /(?:^([ \t]*))?{{[ ]*(?:(\w+):)?[ ]*(\.{3})?(.+?)[ ]*}}/gm,
    (_, indent, tag, spread, expression) => {
      try {
        if (tag) {
          return transform(tag, expression)
        }

        // Evaluate the inner string as a javascript expression.
        // No validation is performed, since this is effectively a javascript
        // runtime. If you give it untrusted input, that's on you.
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
          return evaluated
            .map(element => indent ? indent + element : element)
            .join(options?.separator ?? "\n")
        }

        return indent ? indent + evaluated : evaluated
      } catch (e) {
        errors.push(e instanceof Error ? e : new Error(String(e)))
        return ""
      }
    }
  )
    // Remove backslashes from escaped double-curlies
    .replaceAll(/\\{\\{/g, "{{")
    .replaceAll(/\\}\\}/g, "}}")

  if (errors.length > 0) {
    return E.left(errors)
  } else {
    return E.right(rendered)
  }
}
