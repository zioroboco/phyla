import { Task } from "begat"
import { join } from "path"

type Options = {
  license: "MIT"
  author: string
}

export const license: Task<Options> = {
  implementation: async (context, options) => {
    // TODO: move me to the "before" suite
    if (options.license !== "MIT") {
      throw new Error("Only the MIT license is supported")
    }

    const fs = context.fs.promises
    const cwd = context.cwd

    const packageJson = JSON.parse(
      await fs.readFile(join(cwd, "package.json"), "utf8")
    )

    packageJson.author = options.author
    packageJson.license = options.license

    await fs.writeFile(
      join(cwd, "package.json"),
      JSON.stringify(packageJson, null, 2) + "\n"
    )
  },
}
