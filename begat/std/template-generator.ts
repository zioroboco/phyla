import * as Eta from "eta"
import * as fs_system from "fs/promises"
import { mergeRight } from "ramda"
import { relative, resolve } from "path"
import glob from "fast-glob"
import type { Generator } from "begat/core/api"

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
  patterns?: string | string[]
}

const templateGenerator: Generator<Options> = options => async context => {
  const results = await glob(options.patterns ?? "**/*", { cwd: options.templates })
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
