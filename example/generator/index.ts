import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import eta from "begat-eta"
import type { Generator } from "begat"

const __dirname = dirname(fileURLToPath(import.meta.url))

type Options = {
  projectName: string,
  projectAuthor: string
}

const generator: Generator<Options> = function (options, context) {
  return eta({
    templates: resolve(__dirname, "templates"),
    variables: {
      projectName: options.projectName,
      projectAuthor: options.projectAuthor,
    },
  }, context)
}

export default generator
