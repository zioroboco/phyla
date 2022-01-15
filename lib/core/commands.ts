import { Command, Option } from "clipanion"
import { Context } from "begat/core/api"
import { resolve } from "path"
import { write } from "begat/std/write"

export class WriteCommand extends Command {
  config = Option.String({ name: "config", required: false })

  async execute () {
    await import(resolve(this.config ?? ".begatrc.mjs"))
      .then(module => module.default as Context)
      .then(write)
  }
}
