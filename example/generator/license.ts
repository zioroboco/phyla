import { URL } from "url"
import { fsFromVolume } from "begat/core/volume"
import { template } from "begat/std/template"
import type { Generator } from "begat"

const templates = new URL("./templates", import.meta.url).pathname

type Options = {
  license: "MIT"
  author: string
}

export const license: Generator<Options> = function (options) {
  if (options.license !== "MIT") {
    throw new Error("Only the MIT license is supported")
  }

  return async function (context) {
    const fs = fsFromVolume(context.volume).promises

    const packageJson = JSON.parse(await fs.readFile("/package.json", "utf8"))

    packageJson.author = options.author
    packageJson.license = options.license

    await fs.writeFile(
      "/package.json",
      JSON.stringify(packageJson, null, 2) + "\n"
    )

    await template({
      templates,
      variables: {
        author: options.author,
      },
    })(context)

    return context
  }
}
