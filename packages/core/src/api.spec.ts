import * as TE from "fp-ts/TaskEither"
import * as path from "path"
import { describe, expect, it } from "@jest/globals"
import { flow } from "fp-ts/lib/function"

import { Context, Definition, pipeline, task } from "./api.js"

const simple = task((params: { dir: string }) => ({
  name: "my-task",
  run: async ctx => {
    ctx.cwd = path.join(ctx.cwd, params.dir)
  },
}))

describe(`the ${task.name} factory`, () => {
  describe(`initialised with a simple task`, () => {
    const instance = simple({ dir: "blep" })

    it(`can be run`, async () => {
      const context: Context = { cwd: "/", stack: [] }
      const result = await instance(TE.of(context))()
      expect(result).toMatchObject({ right: { cwd: "/blep" } })
    })

    it(`can be chained`, async () => {
      const context: Context = { cwd: "/", stack: [] }
      const pipeline = flow(instance, instance)
      const result = await pipeline(TE.of(context))()
      expect(result).toMatchObject({ right: { cwd: "/blep/blep" } })
    })
  })

  describe(`initialised with a task which examines the stack`, () => {
    it(`sees its own name`, async () => {
      const context: Context = { cwd: "/", stack: [] }

      const checkStack = task(() => ({
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

describe(`the ${pipeline.name} factory`, () => {
  describe(`initialised with a simple task module`, () => {
    const simpleTaskModule = Promise.resolve({ default: simple })
    const simplePipeline = pipeline({
      name: "simple-pipeline",
      tasks: [simpleTaskModule],
      parameters: {
        dir: "blep",
      },
    })

    it(`can be run`, async () => {
      const chainable = await simplePipeline({})
      const result = await chainable(TE.of({ cwd: "/", stack: [] }))()
      expect(result).toMatchObject({ right: { cwd: "/blep" } })
    })

    it(`can be chained`, async () => {
      const chainable = await simplePipeline({})

      const result = await flow(
        chainable,
        chainable,
        chainable
      )(TE.of({ cwd: "/", stack: [] }))()

      expect(result).toMatchObject({ right: { cwd: "/blep/blep/blep" } })
    })
  })

  describe(`initialised with multiple simple task module`, () => {
    const simpleTaskModule = Promise.resolve({ default: simple })
    const simplePipelineComposingTasks = pipeline({
      name: "simple-pipeline-composing",
      tasks: [simpleTaskModule, simpleTaskModule],
      parameters: {
        dir: "blep",
      },
    })

    it(`can be run`, async () => {
      const chainable = await simplePipelineComposingTasks({})

      const result = await flow(
        chainable,
        chainable
      )(TE.of({ cwd: "/", stack: [] }))()

      expect(result).toMatchObject({ right: { cwd: "/blep/blep/blep/blep" } })
    })

    describe(`initialised with a factory function`, () => {
      const simpleTaskModule = Promise.resolve({ default: simple })
      const simplePipeline = pipeline((params: { fancyPath: string }) => ({
        name: "simple-pipeline-from-factory",
        tasks: [simpleTaskModule],
        parameters: {
          dir: params.fancyPath,
        },
      }))

      it(`can be run`, async () => {
        const chainable = await simplePipeline({ fancyPath: "bork" })
        const result = await chainable(TE.of({ cwd: "/", stack: [] }))()
        expect(result).toMatchObject({ right: { cwd: "/bork" } })
      })
    })
  })

  it(`merges parameter types`, () => {
    pipeline(() => ({
      name: "pipeline",
      tasks: [
        Promise.resolve({
          default: task((p: { one: string }) => ({} as Definition)),
        }),
        Promise.resolve({
          default: task((p: { two: string }) => ({} as Definition)),
        }),
      ],
      parameters: {
        one: "",
        two: "",
      },
    }))
  })

  it(`type errors when initialised with a missing parameter`, () => {
    pipeline({
      tasks: [Promise.resolve({ default: simple })],
      // @ts-expect-error
      parameters: {},
    })
  })
})
