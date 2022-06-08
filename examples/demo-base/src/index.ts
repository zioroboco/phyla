import  * as path from "path"
import * as phyla from "@phyla/core"
import { fileURLToPath } from "url"
import { task as template } from "@phyla/template"
import { toPairs } from "ramda"

export type PackageTaskParameters = {
  /** The package name. */
  name: string
  /** The package's non-development dependencies. */
  dependencies: { [key: string]: string }
}

export default phyla.task((params: PackageTaskParameters) => ({
  run: async ctx => {
    const templateDir = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "../templates"
    )
    await template(ctx, {
      directory: templateDir,
      variables: {
        name: params.name,
        dependencies: toPairs(params.dependencies),
      },
    })
  },
}))
