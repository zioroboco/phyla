import { Command, Option } from "clipanion"
import { inspect } from "util"
import { resolve } from "path"

enum Category {
  Main = "main",
  Util = "util",
}

const importConfig = async function (configPath?: string) {
  return import(resolve(configPath ?? ".begatrc.mjs")).then(
    module => module.default
  )
}

export class RunCommand extends Command {
  static paths = [["run"]]
  static usage = Command.Usage({
    category: Category.Main,
    description: `Run pipeline configured at path (default: ".")`,
  })

  config = Option.String({ name: "path", required: false })

  async execute () {
    const config = await importConfig(this.config)
  }
}

export class ShowConfigCommand extends Command {
  static paths = [["config"]]
  static usage = Command.Usage({
    category: Category.Util,
    description: `Write config at path to stdout (default: ".")`,
  })

  config = Option.String({ name: "path", required: false })

  async execute () {
    const config = await importConfig(this.config)
    this.context.stdout.write(inspect(config))
    process.exit(0)
  }
}
