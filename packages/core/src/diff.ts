import { strict as assert } from "assert"
import { spawn } from "child_process"

import { TaskInstance, execute } from "./core.js"

export type DiffConfig = {
  srcdir: string
  tmpdir: string
  tasks: TaskInstance[]
  io: {
    stdin: NodeJS.ReadableStream
    stdout: NodeJS.WritableStream
    stderr: NodeJS.WritableStream
  },
  ci: boolean
}

export async function diff (config: DiffConfig): Promise<number> {
  const { srcdir, tmpdir } = config

  await new Promise((res, rej) => {
    const rsync = spawn(
      "rsync",
      [
        "--archive",
        "--checksum",
        "--delete",
        "--inplace",
        `${srcdir}/`,
        `${tmpdir}/`,
        "--exclude",
        ".git/",
      ]
    )
    rsync.on("error", rej)
    rsync.on("exit", code => {
      assert(code != null)
      code > 0 ? rej(code) : res(code)
    })
  }).catch(err => {
    throw new Error(`rsync failed: ${err}`)
  })

  const [firstTask, ...nextTasks] = config.tasks

  await execute(firstTask, {
    cwd: tmpdir,
    fs: await import("fs"),
    io: config.io,
    tasks: {
      prev: [],
      next: nextTasks,
    },
  }).catch(err => {
    throw new Error(`pipeline failed: ${err}`)
  })

  return new Promise((res, rej) => {
    const git = spawn(
      "git",
      [
        "diff",
        "--no-index",
        "--patch",
        srcdir,
        tmpdir,
        ...(config.ci ? ["--exit-code"] : []),
      ],
      { stdio: "inherit" }
    )
    git.on("error", rej)
    git.on("exit", code => {
      assert(code != null)
      code > 0 ? rej(code) : res(code)
    })
  })
}
