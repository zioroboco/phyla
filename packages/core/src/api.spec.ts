import * as TE from "fp-ts/TaskEither"
import * as path from "path"
import { describe, expect, it } from "@jest/globals"
import { flow } from "fp-ts/lib/function"

import * as Phyla from "./api.js"

const simple = Phyla.task((params: { dir: string }) => ({
  name: "my-task",
  run: async ctx => {
    ctx.cwd = path.join(ctx.cwd, params.dir)
  },
}))

describe(`the ${Phyla.task.name} factory`, () => {
  describe(`initialised with a simple task`, () => {
    const instance = simple({ dir: "blep" })

    it(`can be run`, async () => {
      const context: Phyla.Context = { cwd: "/", stack: [] }
      const result = await instance(TE.of(context))()
      expect(result).toMatchObject({ right: { cwd: "/blep" } })
    })

    it(`can be chained`, async () => {
      const context: Phyla.Context = { cwd: "/", stack: [] }
      const pipeline = flow(instance, instance)
      const result = await pipeline(TE.of(context))()
      expect(result).toMatchObject({ right: { cwd: "/blep/blep" } })
    })
  })

  describe(`initialised with a task which examines the stack`, () => {
    it(`sees its own name`, async () => {
      const context: Phyla.Context = { cwd: "/", stack: [] }

      const checkStack = Phyla.task(() => ({
        name: "check-stack",
        run: async ctx => {
          expect(ctx.stack).toEqual(["check-stack"])
        },
      }))

      const pipeline = flow(checkStack({}))
      await pipeline(TE.of(context))()
      expect.assertions(1)
    })
  })
})

describe(`the ${Phyla.pipeline.name} factory`, () => {
  it(`merges parameter types`, () => {
    Phyla.pipeline({
      tasks: [
        Promise.resolve({
          default: Phyla.task((p: { one: string }) => ({} as Phyla.Definition)),
        }),
        Promise.resolve({
          default: Phyla.task((p: { two: string }) => ({} as Phyla.Definition)),
        }),
      ],
      parameters: {
        one: "",
        two: "",
      },
    })
  })

  it(`type errors when initialised with a missing parameter`, () => {
    Phyla.pipeline({
      tasks: [Promise.resolve({ default: simple })],
      // @ts-expect-error
      parameters: {},
    })
  })
})
