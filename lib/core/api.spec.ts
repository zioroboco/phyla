import { OPTIONS_POS, Task, TaskFn, config } from "./api"
import { expect, it } from "@jest/globals"
import { expectType } from "ts-expect"

it(`includes the options argument to task fns in the expected position`, () => {
  const options = { property: null }
  const taskFn: TaskFn<typeof options, void> = (ctx, opts) => {}
  expectType<Parameters<typeof taskFn>[OPTIONS_POS]>(options)
})

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
    const taskOne: Task<{ one: 1 }> = { implementation: (ctx, opts) => {} }
    const taskTwo: Task<{ two: 2 }> = { implementation: (ctx, opts) => {} }

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
