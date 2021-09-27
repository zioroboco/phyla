import { Generator, withDependencies, withGenerators } from "."
import { expectType } from "ts-expect"
import { fsFromVolume, Volume } from "./volume"

const fnOne = async (_: { one: 1 }) => {}
const fnTwo = async (_: { one: 1; two: 2; three?: 3 }) => {}

describe(withDependencies.name, () => {
  const fs = fsFromVolume(new Volume())
  it(`has the expected type`, () => {
    expectType<{ withConfig: (config: { one: 1; two: 2; three?: 3 }) => void }>(
      withDependencies({ fs }).withGenerators([fnOne, fnTwo])
    )
  })
})

describe(withGenerators.name, () => {
  it(`has the expected type`, () => {
    expectType<{
      withConfig: (config: { one: 1; two: 2; three?: 3 }) => Promise<void>
    }>(withGenerators([fnOne, fnTwo]))
  })
})

test(`end-to-end`, async () => {
  const volume = new Volume()
  const fs = fsFromVolume(volume)

  type MyGenerator = Generator<{ projectName: string }>
  const myGenerator: MyGenerator = async (config, deps) => {
    const { fs } = deps
    await fs.writeFile("/README.md", `# ${config.projectName}\n`)
  }

  await withDependencies({ fs })
    .withGenerators([myGenerator])
    .withConfig({ projectName: "my-project" })

  expect(volume.toJSON()).toMatchObject({
    "/README.md": "# my-project\n",
  })
})
