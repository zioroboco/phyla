import { exampleGenerator } from "begat-example-generator"
import { apply } from "begat"

apply
  .generators([
    exampleGenerator,
  ])
  .withOptions({
    projectName: "begat-example-project",
    projectAuthor: "Dirk Gently",
  })
  .then(function ({ volume }) {
    console.log(volume.toJSON())
  })
