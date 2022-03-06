import * as TE from "fp-ts/TaskEither"
import * as path from "path"
import { describe, expect, it, jest } from "@jest/globals"
import { flow } from "fp-ts/lib/function"

import { Context, TaskDefinition, pipeline, task } from "./api.js"

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
          default: task((p: { one: string }) => ({} as TaskDefinition)),
        }),
        Promise.resolve({
          default: task((p: { two: string }) => ({} as TaskDefinition)),
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

describe(`the task call stack`, () => {
  const checkStack = task((params: { examine: Function }) => ({
    name: "check-stack",
    run: async ctx => {
      params.examine([...ctx.stack])
    },
  }))

  it(`reports task names`, async () => {
    const examine = jest.fn()
    const context: Context = { cwd: "/", stack: [] }

    await checkStack({ examine })(TE.of(context))()

    expect(examine).toHaveBeenCalledWith(["check-stack"])
  })

  describe(`when tasks are composed within a pipeline`, () => {
    const checkPipeline = pipeline((params: { examine: Function }) => ({
      name: "check-pipeline",
      tasks: [Promise.resolve({ default: checkStack })],
      parameters: {
        ...params,
      },
    }))

    it(`reports its the task and pipeline names`, async () => {
      const examine = jest.fn()
      const context: Context = { cwd: "/", stack: [] }

      await checkPipeline({ examine })
        .then(p => p(TE.of(context)))
        .then(p => p())

      expect(examine).toHaveBeenCalledWith(["check-pipeline", "check-stack"])
    })
  })
})
