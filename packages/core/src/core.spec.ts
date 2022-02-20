import { describe, expect, it, jest } from "@jest/globals"

import { Context, TaskInstance, config, run, task } from "./core.js"

it(`type errors when config doesn't match parameters`, () => {
  type Parameters = { oddlySpecific: "value" }
  const someTask = task((parameters: Parameters) => ({
    run: function (ctx: Context) {},
  }))

  config({
    pipeline: [Promise.resolve({ default: someTask })],
    parameters: {
      // @ts-expect-error
      oddlySpecific: "woo, something else",
    },
  })
})

describe(config.name, () => {
  it(`returns its parameters intact`, async () => {
    const args = { pipeline: [], parameters: Object.freeze({ key: "value" }) }
    expect((await config(args)).parameters).toEqual(args.parameters)
  })

  describe(`with tasks`, () => {
    const taskOne = task((params: { one: 1 }) => ({ run: ctx => {} }))
    const taskTwo = task((params: { two: 2 }) => ({ run: ctx => {} }))

    it(`type errors on specific missing parameters`, () => {
      // @ts-expect-error
      config({ pipeline: [Promise.resolve({ default: taskOne })], parameters: {} })
    })

    it(`type errors on unexpected parameters`, () => {
      // @ts-expect-error
      config({ pipeline: [Promise.resolve({ default: taskOne })], parameters: { one: 1, unexpected: "??" } })
    })

    it(`expects a union of multiple task's parameters`, () => {
      config({ pipeline: [Promise.resolve({ default: taskOne }), Promise.resolve({ default: taskTwo })], parameters: { one: 1, two: 2 } })

      // @ts-expect-error
      config({ pipeline: [Promise.resolve({ default: taskOne }), Promise.resolve({ default: taskTwo })], parameters: { one: 1 } })

      // @ts-expect-error
      config({ pipeline: [Promise.resolve({ default: taskOne }), Promise.resolve({ default: taskTwo })], parameters: { two: 2 } })
    })
  })
})

describe(run.name, () => {
  const firstMock = jest.fn()
  const first = { run: firstMock } as TaskInstance

  const secondMock = jest.fn()
  const second = { run: secondMock } as TaskInstance

  const thirdMock = jest.fn()
  const third = { run: thirdMock } as TaskInstance

  const context: Context = {
    cwd: "/somewhere",
    fs: {} as typeof import("fs"),
    pipeline: {
      prev: [],
      next: [second, third],
    },
  }

  it(`runs tasks from the passed context`, async () => {
    await run(first, context)

    expect(firstMock).toHaveBeenCalledWith(expect.objectContaining({
      pipeline: {
        prev: [],
        next: [second, third],
      },
    }))

    expect(secondMock).toHaveBeenCalledWith(expect.objectContaining({
      pipeline: {
        prev: [first],
        next: [third],
      },
    }))

    expect(thirdMock).toHaveBeenCalledWith(expect.objectContaining({
      pipeline: {
        prev: [first, second],
        next: [],
      },
    }))
  })
})

describe(task.name, () => {
  it(`returns task instances`, async () => {
    const taskOne = task((parameters: { one: 1 }) => ({ run: ctx => {} }))
    const taskTwo = task<{ two: 2 }>(parameters => ({ run: ctx => {} }))

    config({
      pipeline: [
        Promise.resolve({ default: taskOne }),
        Promise.resolve({ default: taskTwo }),
      ],
      parameters: {
        one: 1,
        two: 2,
      },
    })
  })
})
