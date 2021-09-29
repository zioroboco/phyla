import { Generator, fsFromVolume } from "begat"
import { render } from "eta"

type Config = {
  templates: string
  variables: { [key: string]: string }
}

const eta: Generator<Config> = async function (config, { volume }) {
  const fs = fsFromVolume(volume).promises

  const output = await render(
    `name: <%= it.name %>`,
    { name: config.variables.projectAuthor },
    { autoEscape: false }
  )

  if (!output) {
    throw new Error("Failed to render template")
  }

  await fs.writeFile("/out.txt", output)
}

export default eta
