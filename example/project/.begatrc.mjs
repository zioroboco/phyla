import { exampleGenerator } from "begat-example-generator"
import { apply } from "begat"
import { clone } from "begat/std/clone"
import { patch } from "begat/core/patch"

apply
  .generators([
    clone,
    exampleGenerator,
  ])
  .withOptions({
    projectName: "begat-example-project",
    projectAuthor: "Dirk Gently",
  })
  .then(patch)
