import { expect, it } from "@jest/globals"
import { license } from "./license"

it(`passes`, () => {
  expect(license).toBeTruthy()
})
