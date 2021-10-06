import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import { template } from "begat/std/template"
import type { Generator } from "begat"

const __dirname = dirname(fileURLToPath(import.meta.url))

type Options = {
  projectName: string,
  projectAuthor: string
}

export const exampleGenerator: Generator<Options> = function (options) {
  return template({
    templates: resolve(__dirname, "templates"),
    variables: {
      projectName: options.projectName,
      projectAuthor: options.projectAuthor,
    },
  })
}
