import { Command } from "clipanion"
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

export class RunCommand extends Command {
  static paths = [["run"]]
  static usage = Command.Usage({
    category: Category.Main,
    description: `Run pipeline`,
  })

  async execute () {
    const config = await importConfig()
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
