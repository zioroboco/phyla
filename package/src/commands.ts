import * as path from "path"
import { Command, Option } from "clipanion"
import { inspect } from "util"

import * as core from "begat/core"
import * as server from "begat/server"

enum Category {
  Main = "main",
  Util = "util",
}

const getPipelineConfig = async function (dir: string): Promise<core.Config> {
  return import(path.join(dir, ".begatrc.mjs")).then(
    module => module.default
  )
}

export class DevCommand extends Command {
  static paths = [["dev"]]
  static usage = Command.Usage({
    category: Category.Main,
  })

  srcdir = Option.String({ name: "project", required: false })
  watch = Option.Array("--watch", { required: false })
  exclude = Option.Array("--exclude", { required: false })

  async execute () {
    this.srcdir = path.resolve(this.srcdir ?? ".")
    this.watch = this.watch ?? []
    this.exclude = this.exclude ?? []

    const { pipeline, options: pipelineOptions } = await getPipelineConfig(
      this.srcdir
    )

    const serverInstance = server
      .withConfig({
        srcdir: path.resolve(this.srcdir),
        watch: this.watch,
        exclude: this.exclude,
        tasks: pipeline.map(task => task(pipelineOptions)),
        io: this.context,
      })
      .start()

    serverInstance.subscribe(state => {
      this.context.stdout.write(
        `🧬 ${String(state.value).replaceAll("_", " ")}...\n`
      )
    })
  }
}

export class WriteCommand extends Command {
  static paths = [["write"]]
  static usage = Command.Usage({
    category: Category.Main,
    description: `Run pipeline and write changes to disk`,
  })

  srcdir = Option.String({ name: "project", required: false })

  async execute () {
    this.srcdir = path.resolve(this.srcdir ?? ".")

    const config: core.Config = await getPipelineConfig(this.srcdir)

    const [head, ...rest] = config.pipeline.map(task => task(config.options))

    await core.run(head, {
      fs: await import("fs"),
      cwd: process.cwd(),
      pipeline: {
        prev: [],
        next: rest,
      },
    })
  }
}

export class ConfigCommand extends Command {
  static paths = [["config"]]
  static usage = Command.Usage({
    category: Category.Util,
    description: `Write config to stdout`,
  })

  srcdir = Option.String({ name: "project", required: false })

  async execute () {
    this.srcdir = path.resolve(this.srcdir ?? ".")

    await getPipelineConfig(this.srcdir).then(config => {
      this.context.stdout.write(inspect({
        project: this.srcdir,
        ...config,
      }))
      process.exit(0)
    }).catch(err => {
      this.context.stderr.write(err.message)
      process.exit(1)
    })
  }
}
