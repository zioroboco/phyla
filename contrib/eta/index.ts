import { Generator } from "begat"

type Config = {
  templates: string
  variables: { [key: string]: string }
}

const generator: Generator<Config> = async function (config) {
}

export default generator
