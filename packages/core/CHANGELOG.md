# @phyla/core

## 0.2.0

### Minor Changes

- [`03ea623`](https://github.com/zioroboco/phyla/commit/03ea6237fa2b64cbfa027007602e70cba96f7b7f) Thanks [@zioroboco](https://github.com/zioroboco)! - Add diff command, to diff against pipeline output and exit non-zero on changes.

* [`e59c901`](https://github.com/zioroboco/phyla/commit/e59c901631dce91e6226ef21c0ff52f9d2d613a6) Thanks [@zioroboco](https://github.com/zioroboco)! - Pass stdio steams in to pipelines via context.

- [`9e4f42b`](https://github.com/zioroboco/phyla/commit/9e4f42bfea8c27c6a63926fee088dec1d7c7251e) Thanks [@zioroboco](https://github.com/zioroboco)! - Significant API changes:
  - Remove the dot prefix from the pipeline config filename
  - Rename "config" to a "pipeline of tasks" (conceptually)
  - Rename pipeline "options" to "parameters" (conceptually)
  - Replace `Task` type with a type-safe `task` function
  - Import task modules directly in the pipeline config
  - Make all types private (for now)

## 0.1.1

### Patch Changes

- [`b2e1d81`](https://github.com/zioroboco/phyla/commit/b2e1d81869e86507193c3bfcdaa7a19d9c73cb22) - Fix missing docs.

## 0.1.0

### Minor Changes

- [`4471d29`](https://github.com/zioroboco/phyla/commit/4471d29c81cd20c64905f66c899592dc3ea05768) - Release as `@phyla/core` and `@phyla/assert`.

### Patch Changes

- Updated dependencies [[`4471d29`](https://github.com/zioroboco/phyla/commit/4471d29c81cd20c64905f66c899592dc3ea05768)]:
  - @phyla/assert@0.1.0
