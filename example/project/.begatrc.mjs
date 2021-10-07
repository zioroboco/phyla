import { exampleGenerator } from "begat-example-generator"
import { begat } from "begat"
import { clone } from "begat/std/clone"
import { diff } from "begat/std/diff"

begat
  .compose([
    clone,
    exampleGenerator,
  ])
  .withOptions({
    projectName: "begat-example-project",
    projectAuthor: "Dirk Gently",
  })
  .then(diff)
