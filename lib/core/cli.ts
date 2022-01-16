import { Command, Option } from "clipanion"
import { resolve } from "path"

export class WriteCommand extends Command {
  config = Option.String({ name: "config", required: false })

  async execute () {
    await import(resolve(this.config ?? ".begatrc.mjs"))
      .then(config => console.log({ config }))
  }
}
