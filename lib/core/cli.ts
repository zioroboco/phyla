import { Command } from "clipanion"
import { Config, Context, run } from "begat/core/api"
import { inspect } from "util"
import { join } from "path"

enum Category {
  Main = "main",
  Util = "util",
}

const importConfig = async function () {
  return import(join(process.cwd(), ".begatrc.mjs")).then(
    module => module.default
  )
}

export class WriteCommand extends Command {
  static paths = [["write"]]
  static usage = Command.Usage({
    category: Category.Main,
    description: `Run pipeline and write changes to disk`,
  })

  async execute () {
    const config: Config = await importConfig()

    const context: Context = {
      fs: await import("fs"),
      cwd: process.cwd(),
      pipeline: config.pipeline.map(task => task(config.options)),
    }

    await run(context)
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
