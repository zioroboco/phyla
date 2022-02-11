import { Context, Task, TaskInstance, config, run } from "begat/core"
import { describe, expect, it, jest } from "@jest/globals"

describe(config.name, () => {
  it(`returns its arguments intact`, () => {
    const args = Object.freeze({ pipeline: [], options: {} })
    expect(config(args)).toEqual(args)
  })

  it(`type errors on missing top-level properties`, () => {
    // @ts-expect-error
    config({})

    // @ts-expect-error
    config({ pipeline: [] })

    // @ts-expect-error
    config({ options: {} })
  })

  describe(`with tasks`, () => {
    const taskOne: Task<{ one: 1 }> = opts => ({ run: ctx => {} })
    const taskTwo: Task<{ two: 2 }> = opts => ({ run: ctx => {} })

    it(`type errors on specific missing options`, () => {
      // @ts-expect-error
      config({ pipeline: [taskOne], options: {} })
    })

    it(`type errors on unexpected options`, () => {
      // @ts-expect-error
      config({ pipeline: [taskOne], options: { one: 1, unexpected: "??" } })
    })

    it(`expects a union of multiple task's options`, () => {
      config({ pipeline: [taskOne, taskTwo], options: { one: 1, two: 2 } })

      // @ts-expect-error
      config({ pipeline: [taskOne, taskTwo], options: { one: 1 } })

      // @ts-expect-error
      config({ pipeline: [taskOne, taskTwo], options: { two: 2 } })
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
