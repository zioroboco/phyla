import { config } from "begat"
import { license } from "begat-example-task"

export default config({
  pipeline: [license],
  options: {
    author: "Raymond Luxury-Yacht <rayly@example.com>",
    license: "MIT",
  },
})
