import * as phyla from "@phyla/core"
import { task as template } from "@phyla/template"
import expect from "expect"
import * as path from "path"
import { fileURLToPath } from "url"

export type PackageTaskParameters = {
  /** The package name. */
  name: string
}

export default phyla.task((params: PackageTaskParameters) => ({
  run: async ctx => {
    const templateDir = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "../templates",
    )
    await template(ctx, {
      directory: templateDir,
      variables: params,
    })
  },
}))
