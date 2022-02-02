import { Context, OPTIONS_POS, Task, config, run } from "./api"
import { describe, expect, it, jest } from "@jest/globals"
import { expectType } from "ts-expect"

describe(config.name, () => {
  it(`includes options argument to task fns in the expected position`, () => {
    const options = { property: null }
    const taskFn = (ctx: Context, opts: typeof options) => {}
    expectType<Parameters<typeof taskFn>[OPTIONS_POS]>(options)
  })

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
    const taskOne: Task<{ one: 1 }> = { action: (ctx, opts) => {} }
    const taskTwo: Task<{ two: 2 }> = { action: (ctx, opts) => {} }

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
  const taskOne: Task<{ one: 1 }> = { action: jest.fn() }
  const taskTwo: Task<{ two: 2 }> = { action: jest.fn() }

  const context = { cwd: "/somewhere", fs: {} as typeof import("fs") }
  const options = { one: 1, two: 2 } as const

  it(`runs tasks with the passed context and options`, async () => {
    await run(
      context,
      config({ pipeline: [taskOne, taskTwo], options }),
    )

    expect(taskOne.action).toHaveBeenCalledWith(context, options)
    expect(taskTwo.action).toHaveBeenCalledWith(context, options)
  })
})
