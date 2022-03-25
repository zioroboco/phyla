import { expect, it } from "@jest/globals"
import { interpret } from "./interpret.js"

it(`returns templates without variables verbatim`, () => {
  const result = interpret(`blah\nblah`)
  expect(result).toMatch(`blah\nblah`)
})
