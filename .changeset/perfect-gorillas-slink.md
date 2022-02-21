---
"@phyla/core": minor
---

Significant API changes:
  - Remove the dot prefix from the pipeline config filename
  - Rename "config" to a "pipeline of tasks" (conceptually)
  - Rename pipeline "options" to "parameters" (conceptually)
  - Replace `Task` type with a type-safe `task` function
  - Import task modules directly in the pipeline config
  - Make all types private (for now)
