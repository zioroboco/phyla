import { Command, Option } from "clipanion"
import { inspect } from "util"
import { resolve } from "path"

export class ShowConfigCommand extends Command {
  static paths = [["show-config"]]
  static usage = Command.Usage({
    category: "util",
    description: "Write config to stdout.",
  })

  config = Option.String({ name: "path", required: false })

  async execute () {
    const config = await import(resolve(this.config ?? ".begatrc.mjs"))
    this.context.stdout.write(inspect(config.default))
    process.exit(0)
  }
}
