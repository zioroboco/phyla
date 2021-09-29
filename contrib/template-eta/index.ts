import { Generator } from "begat"

export type Config = {
  templates: string
  variables: { [key: string]: string }
}

export const generator: Generator<Config> = async function (config) {
}
