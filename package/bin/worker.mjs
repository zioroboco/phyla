#!/usr/bin/env node

import * as path from "path"
import * as system_fs from "fs"
import * as core from "begat/core"
import { strict as assert } from "assert"

const [node, bin, srcdir, tmpdir] = process.argv

assert(srcdir)
assert(tmpdir)

import(path.join(srcdir, ".begatrc.mjs"))
  .then(({ default: config }) => {
    const [firstTask, ...nextTasks] = config.pipeline.map(task =>
      task(config.options)
    )
    return core.run(firstTask, {
      fs: system_fs,
      cwd: tmpdir,
      pipeline: {
        prev: [],
        next: nextTasks,
      },
    })
  }).catch(() => {
    process.exit(0)
  })
