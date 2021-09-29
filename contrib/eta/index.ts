import { Generator } from "begat"

type Config = {
  templates: string
  variables: { [key: string]: string }
}

const eta: Generator<Config> = async function (config, dependencies) {
  const fs = dependencies.fs.promises
  await fs.writeFile("/stuff.txt", "ding!")
}

export default eta
