import { TypeOf, expectType } from "ts-expect"
import { describe, expect, it, jest } from "@jest/globals"

import { Context, Task, TaskInstance, config, run, task } from "./core.js"

it(`type errors when config doesn't match options`, () => {
  type Options = { oddlySpecific: "value" }
  const task: Task<Options> = options => ({
    run: function (ctx: Context) {},
  })

  config({
    pipeline: [Promise.resolve({ default: task })],
    options: {
      // @ts-expect-error
      oddlySpecific: "woo, something else",
    },
  })
})

describe(config.name, () => {
  it(`returns its options argument intact`, async () => {
    const args = { pipeline: [], options: Object.freeze({ key: "value" }) }
    expect((await config(args)).options).toEqual(args.options)
  })

  describe(`with tasks`, () => {
    const taskOne: Task<{ one: 1 }> = opts => ({ run: ctx => {} })
    const taskTwo: Task<{ two: 2 }> = opts => ({ run: ctx => {} })

    it(`type errors on specific missing options`, () => {
      // @ts-expect-error
      config({ pipeline: [Promise.resolve({ default: taskOne })], options: {} })
    })

    it(`type errors on unexpected options`, () => {
      // @ts-expect-error
      config({ pipeline: [Promise.resolve({ default: taskOne })], options: { one: 1, unexpected: "??" } })
    })

    it(`expects a union of multiple task's options`, () => {
      config({ pipeline: [Promise.resolve({ default: taskOne }), Promise.resolve({ default: taskTwo })], options: { one: 1, two: 2 } })

      // @ts-expect-error
      config({ pipeline: [Promise.resolve({ default: taskOne }), Promise.resolve({ default: taskTwo })], options: { one: 1 } })

      // @ts-expect-error
      config({ pipeline: [Promise.resolve({ default: taskOne }), Promise.resolve({ default: taskTwo })], options: { two: 2 } })
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
    const taskOne = task((opts: { one: 1 }) => ({ run: ctx => {} }))
    const taskTwo = task<{ two: 2 }>(opts => ({ run: ctx => {} }))

    config({
      pipeline: [
        Promise.resolve({ default: taskOne }),
        Promise.resolve({ default: taskTwo }),
      ],
      options: {
        one: 1,
        two: 2,
      },
    })

    expectType<TypeOf<Task<{ one: 1 }>, typeof taskOne>>(true)
    expectType<TypeOf<Task<{ two: 2 }>, typeof taskTwo>>(true)
  })
})
