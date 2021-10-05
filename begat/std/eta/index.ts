import * as Eta from "eta"
import * as fs_system from "fs/promises"
import { mergeRight } from "ramda"
import { relative, resolve } from "path"
import glob from "fast-glob"
import type { Generator } from "begat/core"

type EtaConfig = Parameters<typeof Eta.render>[2]

const defaults: EtaConfig = {
  autoEscape: false,
  autoTrim: false,
  rmWhitespace: false,
}

type Options = {
  templates: string
  variables: { [key: string]: string }
}

const eta: Generator<Options> = async function (options, context) {
  const results = await glob("**/*.eta", { cwd: options.templates })
    .then(files => files
      .map(file => resolve(options.templates, file))
      .map(async path => {
        return fs_system.readFile(path, "utf-8")
          .then(content => Eta.render(content, options.variables, defaults))
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

export default eta
