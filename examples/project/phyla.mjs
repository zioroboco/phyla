// @ts-check
import * as phyla from "@phyla/core"

export default phyla.pipeline({
  tasks: [
    import("@phyla/example-task-package"),
    import("@phyla/example-task-license"),
  ],
  parameters: {
    name: "@phyla/example-project",
    author: "Raymond Luxury-Yacht <rayly@example.com>",
    license: "MIT",
  },
})
