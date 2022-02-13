import * as path from "path"
import { Command, Option } from "clipanion"
import { inspect } from "util"
import { interpret } from "xstate"
import { tmpdir } from "os"

import { Config, run } from "begat/core"
import { serverMachine } from "begat/server"

enum Category {
  Main = "main",
  Util = "util",
}

const getPipelineConfig = async function (): Promise<Config> {
  return import(path.join(process.cwd(), ".begatrc.mjs")).then(
    module => module.default
  )
}

export class DevCommand extends Command {
  static paths = [["dev"]]
  static usage = Command.Usage({
    category: Category.Main,
  })

  workdir = tmpdir()
  srcdir = Option.String("source-dir", { required: true }) ?? process.cwd()

  watch = Option.Array("--watch", { required: false })
  excludes = Option.Array("--exclude", { required: false })

  excludeFlags = [".git/", "node_modules/"]
    .concat(this.excludes ?? [])
    .map(p => `--exclude ${p}`)
    .join(" ")

  serverInstance = interpret(
    serverMachine.withConfig({
      actions: {
        syncProject: async () => {
          // spawn child process
        },

        applyPipeline: async () => {
          const pipelineConfig = await getPipelineConfig()
          const [firstTask, ...nextTasks] = pipelineConfig.pipeline.map(task =>
            task(pipelineConfig.options)
          )

          await run(firstTask, {
            fs: await import("fs"),
            cwd: this.workdir,
            pipeline: {
              prev: [],
              next: nextTasks,
            },
          })
        },

        openEditor: (context, event) => {
          console.log(`Not implemented: openEditor`)
        },

        startWatching: (context, event) => {
          console.log(`Not implemented: startWatching`)
        },

        stopWatching: (context, event) => {
          console.log(`Not implemented: stopWatching`)
        },
      },
    })
  )

  async execute () {
    this.serverInstance.start().subscribe(state => {
      console.log({ state: state.value })
    })

    this.serverInstance.onDone(() => {
      process.exit(0)
    })

    let events = ["APPLY", "READY", "SYNC", "APPLY", "READY"]

    while (true) {
      await new Promise(resolve => setTimeout(resolve, 5000))

      if (events.length === 0) {
        break
      }

      // @ts-ignore
      this.serverInstance.send(events.shift())
    }
  }
}

export class WriteCommand extends Command {
  static paths = [["write"]]
  static usage = Command.Usage({
    category: Category.Main,
    description: `Run pipeline and write changes to disk`,
  })

  async execute () {
    const config: Config = await getPipelineConfig()

    const [head, ...rest] = config.pipeline.map(task => task(config.options))

    await run(head, {
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
