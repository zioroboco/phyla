import { Generator, withGenerators } from "."
import { Volume, fsFromVolume } from "./index"

test(`with one generator`, async () => {
  type MyGenerator = Generator<{ projectName: string }>

  const myGenerator: MyGenerator = async (options, context) => {
    const fs = fsFromVolume(context.volume)
    await fs.promises.writeFile("/README.md", `# ${options.projectName}\n`)
    return context
  }

  const actual = await withGenerators([myGenerator])
    .withContext({ volume: new Volume() })
    .withOptions({ projectName: "my-project" })

  expect(actual.volume.toJSON()).toMatchObject({
    "/README.md": "# my-project\n",
  })
})

test(`with multiple generators`, async () => {
  type GeneratorOne = Generator<{ projectName: string }>

  const generatorOne: GeneratorOne = async (config, context) => {
    const fs = fsFromVolume(context.volume)
    await fs.promises.writeFile("/README.md", `# ${config.projectName}\n`)
    return context
  }

  type GeneratorTwo = Generator<{ projectName: string }>

  const generatorTwo: GeneratorTwo = async (config, context) => {
    const fs = fsFromVolume(context.volume)
    await fs.promises.writeFile("/package.json", `{\n  "name": "${config.projectName}"\n}\n`)
    return context
  }

  const actual = await withGenerators([generatorOne, generatorTwo])
    .withContext({ volume: new Volume() })
    .withOptions({
      projectName: "my-project",
    })

  expect(actual.volume.toJSON()).toMatchObject({
    "/README.md": "# my-project\n",
    "/package.json": `{\n  "name": "my-project"\n}\n`,
  })
})
