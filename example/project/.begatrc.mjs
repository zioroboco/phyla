import * as begat from "begat"
import exampleGenerator from "begat-example-generator"

begat
  .generators([exampleGenerator])
  .options({
    projectName: "begat-example-project",
    projectAuthor: "Dirk Gently",
  })
