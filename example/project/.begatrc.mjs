import * as begat from "begat"
import { clone } from "begat/std/clone"
import { license } from "begat-example-generator"

export default begat
  .pipeline([clone, license])
  .withOptions({
    author: "Raymond Luxury-Yacht <rayly@example.com>",
    license: "MIT",
  })
