import glob from "fast-glob"
import * as E from "fp-ts/Either"
import * as system_fs from "fs"
import * as path from "path"

import { Context } from "@phyla/core"
import { render } from "./render"

type Options = {
  directory: string
  variables: { [key: string]: unknown }
}

export async function task(context: Context, options: Options) {
  const templatePaths = await glob(
    path.join(options.directory, "**/*.template"),
    {
      cwd: process.cwd(),
      fs: system_fs,
    },
  )

  const rendered = await Promise.all(
    templatePaths.map(async templatePath => {
      const templateData = await system_fs.promises.readFile(
        templatePath,
        "utf8",
      )

      const rendered = render(templateData, {
        variables: options.variables,
      })

      if (E.isLeft(rendered)) {
        throw new Error(
          `Error rendering template: ${templatePath}`
            + `\n\n\t${rendered.left}`,
        )
      }

      return {
        templatePath: templatePath.replace(/\.template$/, ""),
        rendered,
      }
    }),
  )

  await Promise.all(
    rendered.map(async ({ templatePath, rendered }) => {
      const interpolatedPath = templatePath.replaceAll(
        /{{[ ]*(.+?)[ ]*}}/g,
        (_, capture) => {
          if (capture in options.variables) {
            const value = options.variables[capture]
            if (typeof value == "string") {
              return value
            }
          }
          throw new Error("No string-valued template variable: " + capture)
        },
      )

      const relativePath = path.relative(options.directory, interpolatedPath)

      await context.fs.promises.mkdir(
        path.dirname(path.join(context.cwd, relativePath)),
        { recursive: true },
      )

      await context.fs.promises.writeFile(
        path.join(context.cwd, relativePath),
        rendered.right,
      )
    }),
  )
}
