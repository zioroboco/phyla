import * as Eta from "eta"
import * as fs_system from "fs/promises"
import { mergeRight } from "ramda"
import { relative, resolve } from "path"
import glob from "fast-glob"
import type { Generator } from "begat/core"

type EtaConfig = Parameters<typeof Eta.render>[2]

const defaultConfig: EtaConfig = {
  autoEscape: false,
  autoTrim: false,
  rmWhitespace: false,
}

type Options = {
  templates: string
  variables: { [key: string]: string }
  config?: EtaConfig
  pattern?: string
}

const templateGenerator: Generator<Options> = options => async context => {
  const pattern = options.pattern ?? "**/*"
  const results = await glob(pattern, { cwd: options.templates })
    .then(files => files
      .map(file => resolve(options.templates, file))
      .map(async path => {
        return fs_system.readFile(path, "utf-8")
          .then(content => Eta.render(content, options.variables, {
            ...defaultConfig,
            ...options.config,
          }))
          .then(rendered => ({
            path: relative(options.templates, path.replace(/\.eta$/, "")),
            rendered,
          }))
      })
    ).then(promises => Promise.all(promises))

  const errors = results
    .filter(({ rendered }) => rendered === undefined)
    .reduce((acc, { path }) => [...acc, path], [] as string[])

  if (errors.length > 0) {
    throw new Error(
      `Failed to render ${errors.length} templates: ${errors.join(", ")}`
    )
  }

  context.volume.fromJSON(mergeRight(
    context.volume.toJSON(),
    results.reduce((acc, { path, rendered }) => ({
      ...acc,
      [resolve("/", path)]: rendered,
    }), {})
  ))

  return context
}

export default templateGenerator
