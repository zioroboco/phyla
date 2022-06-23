#!/usr/bin/env node --experimental-specifier-resolution=node --experimental-import-meta-resolve

import { strict as assert } from "assert"
import * as system_fs from "fs"
import * as path from "path"

import * as phyla from "@phyla/core"

const [node, bin, srcdir, tmpdir] = process.argv

assert(srcdir)
assert(tmpdir)

import(path.join(srcdir, "phyla.mjs"))
  .then(async pipelineModule => {
    const task = await pipelineModule.default({})
    return phyla.run(task, {
      fs: system_fs,
      cwd: tmpdir,
      stack: [],
    })
  })
  .catch(err => {
    console.error(`worker reported error:`)
    console.error("  " + String(err).replaceAll(/\n/g, "\n  "))
    process.exit(0)
  })
