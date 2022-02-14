import * as path from "path"
import * as system_fs from "fs"
import * as core from "begat/core"

const { srcdir, tmpdir } = process.env

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
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
