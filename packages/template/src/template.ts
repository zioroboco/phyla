import * as eta from "eta"
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

const etaConfig: Partial<typeof eta.config> = {
  autoEscape: false,
  autoTrim: false,
  rmWhitespace: false,
  useWith: true,
  tags: ["{{", "}}"],
  parse: {
    exec: "$",
    interpolate: "",
    raw: "~",
  },
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

      const rendered = await eta.render(
        templateData,
        options.variables,
        etaConfig
      )

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
