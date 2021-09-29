import * as Eta from "eta"
import * as fs_system from "fs/promises"
import * as glob from "fast-glob"
import { Generator, fsFromVolume } from "begat"
import { resolve } from "path"

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

const eta: Generator<GeneratorConfig> = async function (config, { volume }) {
  const fs = fsFromVolume(volume).promises

  const results = await glob("**/*.eta", { cwd: config.templates })
    .then(files => files
      .map(file => resolve(config.templates, file))
      .map(async path => {
        return fs_system.readFile(path, "utf-8")
          .then(content => Eta.render(content, config.variables, defaults))
          .then(rendered => ({ path, rendered }))
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

  volume.toJSON()
  results
}

export default eta
