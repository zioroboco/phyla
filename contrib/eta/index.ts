import * as Eta from "eta"
import * as fs_system from "fs/promises"
import { Generator } from "begat"
import { mergeRight } from "ramda"
import { relative, resolve } from "path"
import glob from "fast-glob"

type EtaConfig = Parameters<typeof Eta.render>[2]

const defaults: EtaConfig = {
  autoEscape: false,
  autoTrim: false,
  rmWhitespace: false,
}

type GeneratorConfig = {
  templates: string
  variables: { [key: string]: string }
}

const eta: Generator<GeneratorConfig> = async function (config, context) {
  const results = await glob("**/*.eta", { cwd: config.templates })
    .then(files => files
      .map(file => resolve(config.templates, file))
      .map(async path => {
        return fs_system.readFile(path, "utf-8")
          .then(content => Eta.render(content, config.variables, defaults))
          .then(rendered => ({
            path: relative(config.templates, path.replace(/\.eta$/, "")),
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
      [resolve("/", path)]: rendered,
    }), {})
  ))

  return context
}

export default eta
