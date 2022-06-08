// @ts-check
import * as phyla from "@phyla/core"

export default phyla.pipeline({
  tasks: [
    import("demo-base"),
  ],
  parameters: {
    name: "example-project",
    dependencies: {
      "@phyla/core": "workspace:*",
      "demo-base": "workspace:*",
    }
  },
})
