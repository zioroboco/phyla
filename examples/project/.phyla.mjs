import { config } from "@phyla/core"

export default config({
  pipeline: [
    import("@phyla/example-task"),
  ],
  options: {
    author: "Raymond Luxury-Yacht <rayly@example.com>",
    license: "MIT"
  },
})
