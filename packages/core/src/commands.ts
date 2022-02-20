import * as path from "path"

import { Command, Option } from "clipanion"
import { richFormat } from "clipanion/lib/format.js"

import * as core from "./core.js"
import * as server from "./server.js"
import { dim } from "./reporting.js"

enum Category {
  Main = "main",
}

async function getTasks (dir: string): Promise<core.TaskInstance[]> {
  const projectConfig = await import(path.join(dir, "phyla.mjs")).then(
    module => module.default as core.Config
  )
  const { pipeline, parameters } = projectConfig
  return pipeline.map(task => task(parameters))
}

export class DevCommand extends Command {
  static paths = [["dev"]]
  static usage = Command.Usage({
    category: Category.Main,
    description: `Start a development server`,
  })

  srcdir = Option.String({ name: "project", required: false })
  watch = Option.Array("--watch", { required: false })
  exclude = Option.Array("--exclude", { required: false })
  verbose = Option.Boolean("--verbose", { required: false })

  async execute () {
    this.srcdir = path.resolve(this.srcdir ?? ".")
    this.watch = this.watch ?? []
    this.exclude = this.exclude ?? []

    const log: server.Logger = {
      verbose: this.verbose ?? false,
      info: console.info,
      warn: console.warn,
      debug: this.verbose
        ? (args: any) =>
          console.debug(typeof args == "string" ? dim(args) : args)
        : () => {},
      header: args => console.info(richFormat.header(args) + "\n"),
      serverinfo: [this.cli.binaryLabel, this.cli.binaryVersion].join(" - "),
    }

    server
      .withConfig({
        srcdir: path.resolve(this.srcdir),
        watch: this.watch,
        exclude: this.exclude,
        getTasks: dir => getTasks(dir),
        log: log,
        io: this.context,
      })
      .start()
  }
}

export class WriteCommand extends Command {
  static paths = [["write"]]
  static usage = Command.Usage({
    category: Category.Main,
    description: `Write changes to disk`,
  })

  srcdir = Option.String({ name: "project", required: false })

  async execute () {
    this.srcdir = path.resolve(this.srcdir ?? ".")

    const [firstTask, ...nextTasks] = await getTasks(this.srcdir)

    await core.run(firstTask, {
      fs: await import("fs"),
      cwd: this.srcdir,
      pipeline: {
        prev: [],
        next: nextTasks,
      },
    })
  }
}
