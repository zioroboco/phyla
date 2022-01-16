import { Task } from "begat"

type Options = {
  license: "MIT"
  author: string
}

export const license: Task<Options> = {
  implementation: async (context, options) => {
    if (options.license !== "MIT") {
      throw new Error("Only the MIT license is supported")
    }
  },
}
