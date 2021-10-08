import * as begat from "begat"
import { clone } from "begat/std/clone"
import { diff } from "begat/std/diff"
import { exampleGenerator } from "begat-example-generator"

export default begat
  .pipeline([clone, exampleGenerator])
  .withOptions({
    projectName: "begat-example-project",
    projectAuthor: "Dirk Gently",
  })
  .then(diff)
