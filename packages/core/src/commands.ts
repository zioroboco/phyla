import * as fs from "fs"
import * as os from "os"
import * as path from "path"
import { strict as assert } from "assert"

import { Command, Option } from "clipanion"
import { richFormat } from "clipanion/lib/format"

import * as server from "./server"
import { Chainable, run } from "./api"
import { diff } from "./diff"
import { dim } from "./reporting"

enum Category {
  Main = "main",
}

function getTask (dir: string, parameters = {}): Promise<Chainable> {
  return import(path.join(dir, "phyla.mjs")).then(m => m.default(parameters))
}

function tmpdirSync (srcdir: string): string {
  const tmpdirBase = path.join(os.tmpdir(), "phyla")
  const tmpdirFull = path.join(tmpdirBase, path.basename(srcdir))
  fs.mkdirSync(tmpdirFull, { recursive: true })
  assert(tmpdirFull)
  return tmpdirFull
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
        tmpdir: tmpdirSync(this.srcdir),
        watch: this.watch,
        exclude: this.exclude,
        getTask,
        log: log,
        io: this.context,
      })
      .start()
  }
}

export class DiffCommand extends Command {
  static paths = [["diff"]]
  static usage = Command.Usage({
    category: Category.Main,
    description: `Exit non-zero on changes`,
  })

  srcdir = Option.String({ name: "project", required: false })
  ci = Option.Boolean("--ci", { required: false })

  async execute () {
    this.srcdir = path.resolve(this.srcdir ?? ".")
    const tmpdir = tmpdirSync(this.srcdir)

    await diff({
      srcdir: this.srcdir,
      tmpdir,
      task: await getTask(this.srcdir),
      ci: this.ci ?? false,
      io: this.context,
    }).catch(err => {
      process.exit(1)
    })
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

    const task = await getTask(this.srcdir)

    const result = await run(task, {
      cwd: this.srcdir,
      fs: await import("fs"),
      stack: [],
    })
  }
}
