import * as fs from "fs/promises"
import * as path from "path"
import * as tmp from "tmp-promise"
import { Command } from "clipanion"
import { Config, run } from "begat/core"
import { execa } from "execa"
import { inspect } from "util"
import { watch } from "chokidar"

enum Category {
  Main = "main",
  Util = "util",
}

const importConfig = async function () {
  return import(path.join(process.cwd(), ".begatrc.mjs")).then(
    module => module.default
  )
}

export class DevCommand extends Command {
  static paths = [["dev"]]
  static usage = Command.Usage({
    category: Category.Main,
  })

  async execute () {
    const { cleanup, path: tmpdir } = await tmp.dir()

    const workspace = {
      dir: path.join(tmpdir, "workspace"),
      file: path.join(tmpdir, "begat.code-workspace"),
    }

    const config = {
      folders: [
        { path: workspace.dir },
      ],
    }

    await fs.mkdir(workspace.dir)
    await fs.writeFile(
      path.join(workspace.file),
      JSON.stringify(config)
    )

    await fs.writeFile(
      path.join(workspace.dir, "package.json"),
      JSON.stringify({
        name: "derp",
        version: "69",
      })
    )

    await execa("code", ["--new-window", workspace.file])

    setTimeout(() => {
      cleanup()
    }, 100000)
  }
}

export class WriteCommand extends Command {
  static paths = [["write"]]
  static usage = Command.Usage({
    category: Category.Main,
    description: `Run pipeline and write changes to disk`,
  })

  async execute () {
    const config: Config = await importConfig()

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
    const config = await importConfig()
    this.context.stdout.write(inspect(config))
    process.exit(0)
  }
}
