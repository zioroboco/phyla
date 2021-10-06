import { exampleGenerator } from "begat-example-generator"
import { apply } from "begat"
import { cloneGenerator } from "begat/std/clone-generator"
import { dirname } from "path"
import { fileURLToPath } from "url"
import { patch } from "begat/core/patch"

const __dirname = dirname(fileURLToPath(import.meta.url))

apply
  .generators([
    cloneGenerator,
    exampleGenerator,
  ])
  .withOptions({
    cloneFromPath: __dirname,
    projectName: "begat-example-project",
    projectAuthor: "Dirk Gently",
  })
  .then(async function (context) {
    await patch(context, __dirname)
  })
