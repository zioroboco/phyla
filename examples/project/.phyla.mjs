import { config } from "@phyla/core"
import { license } from "@phyla/example-task"

export default config({
  pipeline: [license],
  options: {
    author: "Raymond Luxury-Yacht <rayly@example.com>",
    license: "MIT"
  },
})
