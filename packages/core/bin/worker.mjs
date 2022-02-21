#!/usr/bin/env node

import * as path from "path"
import * as system_fs from "fs"
import { strict as assert } from "assert"

import * as phyla from "@phyla/core"

const [node, bin, srcdir, tmpdir] = process.argv

assert(srcdir)
assert(tmpdir)

import(path.join(srcdir, "phyla.mjs"))
  .then(async pipelineModule => {
    const pipeline = await pipelineModule.default
    const [firstTask, ...nextTasks] = pipeline.tasks.map(task =>
      task(pipeline.parameters)
    )
    return phyla.execute(firstTask, {
      fs: system_fs,
      cwd: tmpdir,
      tasks: {
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
