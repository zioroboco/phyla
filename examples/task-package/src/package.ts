import  * as path from "path"
import * as phyla from "@phyla/core"
import { fileURLToPath } from "url"
import { template } from "@phyla/core"
import expect from "expect"

export type PackageTaskParameters = {
  /** The package name. */
  name: string
}

export default phyla.task((params: PackageTaskParameters) => ({
  run: async ctx => {
    const templateDir = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "../templates"
    )
    await template(ctx, {
      directory: templateDir,
      variables: params,
    })
  },
}))
