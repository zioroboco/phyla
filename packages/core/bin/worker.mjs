#!/usr/bin/env node

import * as path from "path"
import * as system_fs from "fs"
import { strict as assert } from "assert"

import * as phyla from "@phyla/core"

const [node, bin, srcdir, tmpdir] = process.argv

assert(srcdir)
assert(tmpdir)

import(path.join(srcdir, "phyla.mjs"))
  .then(async configModule => {
    const config = await configModule.default
    const [firstTask, ...nextTasks] = config.pipeline.map(task =>
      task(config.parameters)
    )
    return phyla.run(firstTask, {
      fs: system_fs,
      cwd: tmpdir,
      pipeline: {
        prev: [],
        next: nextTasks,
      },
    })
  })
  .catch(err => {
    console.error(`worker reported error:`)
    console.error("  " + String(err).replaceAll(/\n/g, "\n  "))
    process.exit(0)
  })
