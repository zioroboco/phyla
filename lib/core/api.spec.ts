import { Context, Task, config, run } from "./api"
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
  const taskOneAction = jest.fn() as (ctx: Context) => void
  const taskOne: Task<{ one: 1 }> = opts => ({ run: taskOneAction })

  const taskTwoAction = jest.fn() as (ctx: Context) => void
  const taskTwo: Task<{ two: 2 }> = opts => ({ run: taskTwoAction })

  const options = { one: 1, two: 2 } as const
  const context: Context = {
    cwd: "/somewhere",
    fs: {} as typeof import("fs"),
    pipeline: [taskOne, taskTwo].map(t => t(options)),
  }

  it(`runs tasks with the passed context and options`, async () => {
    await run(context)
    expect(taskOne(options).run).toHaveBeenCalledWith(context)
    expect(taskTwo(options).run).toHaveBeenCalledWith(context)
  })
})
