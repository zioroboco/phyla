import { exampleGenerator } from "begat-example-generator"
import { apply } from "begat"
import { cloneGenerator } from "begat/std/clone-generator"
import { patch } from "begat/core/patch"

apply
  .generators([
    cloneGenerator,
    exampleGenerator,
  ])
  .withOptions({
    projectName: "begat-example-project",
    projectAuthor: "Dirk Gently",
  })
  .then(patch)
