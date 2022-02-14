import * as path from "path"
import { Command, Option } from "clipanion"

import * as core from "begat/core"
import * as server from "begat/server"

enum Category {
  Main = "main",
}

async function getTasks (dir: string): Promise<core.TaskInstance[]> {
  const projectConfig = await import(path.join(dir, ".begatrc.mjs")).then(
    module => module.default as core.Config
  )
  const { pipeline, options: pipelineOptions } = projectConfig
  return pipeline.map(task => task(pipelineOptions))
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

  async execute () {
    this.srcdir = path.resolve(this.srcdir ?? ".")
    this.watch = this.watch ?? []
    this.exclude = this.exclude ?? []

    const serverInstance = server
      .withConfig({
        srcdir: path.resolve(this.srcdir),
        watch: this.watch,
        exclude: this.exclude,
        getTasks: dir => getTasks(dir),
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
