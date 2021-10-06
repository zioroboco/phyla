import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import templateGenerator from "begat/std/template-generator"
import type { Generator } from "begat"

const __dirname = dirname(fileURLToPath(import.meta.url))

type Options = {
  projectName: string,
  projectAuthor: string
}

const exampleGenerator: Generator<Options> = function (options) {
  return templateGenerator({
    templates: resolve(__dirname, "templates"),
    variables: {
      projectName: options.projectName,
      projectAuthor: options.projectAuthor,
    },
  })
}

export default exampleGenerator
