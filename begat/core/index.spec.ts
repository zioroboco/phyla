import { expectType } from "ts-expect"
import { withDependencies, withGenerators } from "."

const fnOne = (_: { one: 1 }) => {}
const fnTwo = (_: { one: 1; two: 2; three?: 3 }) => {}

describe(withDependencies.name, () => {
  it(`has the expected type`, () => {
    expectType<{ withConfig: (config: { one: 1; two: 2; three?: 3 }) => void }>(
      withDependencies({ process }).withGenerators([fnOne, fnTwo])
    )
  })
})

describe(withGenerators.name, () => {
  it(`has the expected type`, () => {
    expectType<{ withConfig: (config: { one: 1; two: 2; three?: 3 }) => void }>(
      withGenerators([fnOne, fnTwo])
    )
  })
})
