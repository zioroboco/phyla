import { exampleGenerator } from "begat-example-generator"
import { begat } from "begat"
import { clone } from "begat/std/clone"
import { patch } from "begat/std/patch"

begat
  .compose([
    clone,
    exampleGenerator,
  ])
  .withOptions({
    projectName: "begat-example-project",
    projectAuthor: "Dirk Gently",
  })
  .then(patch)
