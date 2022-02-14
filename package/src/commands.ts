import * as os from "os"
import * as path from "path"
import { Command, Option } from "clipanion"
import { inspect } from "util"

import * as core from "begat/core"
import * as server from "begat/server"

enum Category {
  Main = "main",
  Util = "util",
}

const getPipelineConfig = async function (): Promise<core.Config> {
  return import(path.join(process.cwd(), ".begatrc.mjs")).then(
    module => module.default
  )
}

export class DevCommand extends Command {
  static paths = [["dev"]]
  static usage = Command.Usage({
    category: Category.Main,
  })

  srcdir = Option.String("source-dir", { required: true }) ?? process.cwd()
  workdir = os.tmpdir()

  watch = Option.Array("--watch", { required: false }) ?? []
  excludes = Option.Array("--exclude", { required: false }) ?? []

  async execute () {
    const { pipeline, options: pipelineOptions } = await getPipelineConfig()

    const serverInstance = server
      .withConfig({
        srcdir: this.srcdir,
        workdir: this.workdir,
        watch: this.watch,
        excludes: this.excludes,
        tasks: pipeline.map(task => task(pipelineOptions)),
      })
      .start()

    serverInstance.subscribe(state => {
      console.log({ state: state.value })
    })

    serverInstance.onDone(() => {
      process.exit(0)
    })
  }
}

export class WriteCommand extends Command {
  static paths = [["write"]]
  static usage = Command.Usage({
    category: Category.Main,
    description: `Run pipeline and write changes to disk`,
  })

  async execute () {
    const config: core.Config = await getPipelineConfig()

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

export class ShowConfigCommand extends Command {
  static paths = [["config"]]
  static usage = Command.Usage({
    category: Category.Util,
    description: `Write config to stdout`,
  })

  async execute () {
    const config = await getPipelineConfig()
    this.context.stdout.write(inspect(config))
    process.exit(0)
  }
}
