import * as E from "fp-ts/Either"
import * as path from "path"
import * as system_fs from "fs"
import glob from "fast-glob"

import { Context } from "../api.js"
import { interpret } from "./interpret.js"

type Options = {
  directory: string
  variables: { [key: string]: string }
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

      const rendered = interpret(templateData, {
        variables: options.variables,
        transform: () => "", // FIXME stubbed tag transform
      })

      if (E.isLeft(rendered)) {
        throw new Error(
          `Error rendering template: ${templatePath}` +
            `\n\n\t${rendered.left.join("\n\t")}`
        )
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
        /{{[ ]*(.+?)[ ]*}}/g,
        (_, capture) => {
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
        rendered.right
      )
    })
  )
}
