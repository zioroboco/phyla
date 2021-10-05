import * as begat from "begat"
import eta from "begat-eta"
import { createRequire } from "module"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))

begat
  .withGenerators([eta])
  .withContext()
  .withOptions({
    templates: resolve(__dirname, "templates"),
    variables: {
      projectName: "amazing-begat-example-project",
      projectVersion: require("./package").version,
      projectAuthor: "Dirk Gently",
    },
  })
