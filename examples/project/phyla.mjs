import * as phyla from "@phyla/core"

export default phyla.pipeline({
  tasks: [
    import("@phyla/example-task-install"),
    import("@phyla/example-task-license"),
  ],
  parameters: {
    author: "Raymond Luxury-Yacht <rayly@example.com>",
    license: "MIT",
  },
})
