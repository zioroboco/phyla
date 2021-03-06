import { strict as assert } from "assert"
import { spawn } from "child_process"
import { Chainable, run } from "./api"

export type DiffConfig = {
  srcdir: string
  tmpdir: string
  task: Chainable
  io: {
    stdin: NodeJS.ReadableStream
    stdout: NodeJS.WritableStream
    stderr: NodeJS.WritableStream
  }
  ci: boolean
}

export async function diff(config: DiffConfig): Promise<number> {
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
      ],
    )
    rsync.on("error", rej)
    rsync.on("exit", code => {
      assert(code != null)
      code > 0 ? rej(code) : res(code)
    })
  }).catch(err => {
    throw new Error(`rsync failed: ${err}`)
  })

  await run(config.task, {
    cwd: tmpdir,
    fs: await import("fs"),
    stack: [],
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
      { stdio: "inherit" },
    )
    git.on("error", rej)
    git.on("exit", code => {
      assert(code != null)
      code > 0 ? rej(code) : res(code)
    })
  })
}
