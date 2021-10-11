import { Command, Option } from "clipanion"
import { Context } from "begat/core/api"
import { resolve } from "path"

export class LogVolumeCommand extends Command {
  config = Option.String({ name: "config", required: false })

  async execute () {
    const context = await import(resolve(this.config ?? ".begatrc.mjs"))
      .then(module => module.default) as Context

    console.log(context.volume.toJSON())
  }
}
