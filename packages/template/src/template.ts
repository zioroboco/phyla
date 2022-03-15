import * as path from "path"
import * as system_fs from "fs"
import glob from "fast-glob"

type Options = {
  directory: string
  variables: {  [key: string]: string }
}

type Context = {
  cwd: string
  fs: typeof system_fs
}

function render (
  input: string,
  variables: { [key: string]: string }
): string {
  const definitions = Object.keys(variables).map(
    key => `let ${key} = ${JSON.stringify(variables[key])}`
  )
  return input
    .replaceAll(
      // Match pairs of double-curlies (unless escaped), capturing the inner
      // string and any preceeding whitespace
      /(\s*){{\s*(.*?)\s*}}/g,
      function (match, whitespace, inner) {
        // Evaluate the inner string as a javascript expression
        const evaluated = new Function(
          [...definitions, `return ${inner}`].join(";")
        )()
        // Return result with captured whitespace applied per-line
        if (whitespace.length > 0) {
          const lines = Array.isArray(evaluated)
            ? evaluated
            : evaluated.split("\n")
          return lines.map((line: string) => `${whitespace}${line}`).join("")
        }
        return evaluated
      }
    )
    // Remove backslashes from escaped double-curlies
    .replaceAll(/\\{\\{/g, "{{")
    .replaceAll(/\\}\\}/g, "}}")
}

export async function template (context: Context, options: Options) {
  const templatePaths = await glob(path.join(options.directory, "**/*"), {
    cwd: process.cwd(),
    fs: system_fs,
  })

  const rendered = await Promise.all(
    templatePaths.map(async templatePath => {
      const templateData = await system_fs.promises.readFile(
        templatePath,
        "utf8"
      )

      const rendered = render(templateData, options.variables)

      if (typeof rendered != "string") {
        throw new Error(`Error rendering template: ${templatePath}`)
      }

      return {
        templatePath: templatePath.replace(/\.template$/, ""),
        rendered,
      }
    })
  )

  await Promise.all(
    rendered.map(async ({ templatePath, rendered }) => {
      const interpolatedPath = templatePath.replaceAll(
        /{{\s*(.+?)\s*}}/g,
        (match, capture) => {
          if (capture in options.variables) {
            return options.variables[capture]
          }
          throw new Error("No template variable: " + capture)
        }
      )

      const relativePath = path.relative(options.directory, interpolatedPath)

      await context.fs.promises.mkdir(
        path.dirname(path.join(context.cwd, relativePath)),
        { recursive: true }
      )

      await context.fs.promises.writeFile(
        path.join(context.cwd, relativePath),
        rendered
      )
    })
  )
}
