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
    variables: { [key: string]: string | any[] },
    separator: string,
    transform: (tag: string, value: string) => string
  }>
): E.Either<Error[], string> {
  const transform = options?.transform ?? transformFallback
  const variables = { ...options?.variables }
  const errors: Error[] = []

  /** Match cases of a single output rendered from multiple blocks. */
  const flagPotentialSpreadMisuse =
    /{{[ \t\n]*(\.{3})?(?:.+?)[ \t\n]*}}[^\n]*?{{[ \t\n]*(\.{3})?/g.exec(
      template
    )

  if (flagPotentialSpreadMisuse) {
    // If a spread operator is included in match, the template is invalid
    const [_, ...spreadsPerFlaggedLine] = flagPotentialSpreadMisuse
    if (spreadsPerFlaggedLine.filter(Boolean).length > 0) {
      errors.push(
        new TemplateError(
          `template contained spread syntax on a line with multiple` +
            ` interpolation expressions`
        )
      )
      return E.left(errors)
    }
  }


  const definitions = Object.keys(variables).map(
    key => `let ${key} = ${JSON.stringify(variables[key])}`
  )

  const rendered = template.replaceAll(
    // Match pairs of double-curlies (unless escaped), capturing the inner
    // string (and optional tag, e.g. `slot:`) and any preceeding whitespace.
    // e.g. `{{ stuff }}`, `{{ ...stuff.map(s => ...) }}`, `{{ slot: stuff }}`
    /(?:^([ \t]*))?{{[ \t\n]*(?:(\w+):[ ]*)?(\.{3})?(.+?)[ \t\n]*}}/gms,
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
            .map(element => element.replaceAll("\n", "\n" + indent))
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
