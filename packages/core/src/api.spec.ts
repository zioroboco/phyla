import * as TE from "fp-ts/TaskEither"
import * as path from "path"
import { describe, expect, it } from "@jest/globals"
import { flow } from "fp-ts/lib/function"

import * as Phyla from "./api.js"

describe(`the ${Phyla.task.name} factory`, () => {
  describe(`a simple task`, () => {
    const chainable = Phyla.task((params: { dir: string }) => ({
      name: "my-task",
      run: async ctx => {
        ctx.cwd = path.join(ctx.cwd, params.dir)
      },
    }))

    describe(`the resulting function`, () => {
      const instance = chainable({ dir: "blep" })

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
  })

  describe(`a task examining the stack`, () => {
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
