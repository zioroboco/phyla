import { Generator, Volume, apply, compose, fsFromVolume } from "."

it(`applies individual generators`, async () => {
  type MyGenerator = Generator<{ projectName: string }>

  const myGenerator: MyGenerator = options => async context => {
    const fs = fsFromVolume(context.volume)
    await fs.promises.writeFile("/README.md", `# ${options.projectName}\n`)
    return context
  }

  const volume = new Volume()
  await myGenerator({ projectName: "my-project" })({ volume })

  expect(volume.toJSON()).toMatchObject({
    "/README.md": "# my-project\n",
  })
})

describe(`with multiple generators`, () => {
  type GeneratorOne = Generator<{ projectName: string }>

  const generatorOne: GeneratorOne = options => async context => {
    const fs = fsFromVolume(context.volume)
    await fs.promises.writeFile("/README.md", `# ${options.projectName}\n`)
    return context
  }

  type GeneratorTwo = Generator<{ projectName: string }>

  const generatorTwo: GeneratorTwo = options => async context => {
    const fs = fsFromVolume(context.volume)
    await fs.promises.writeFile("/package.json", `{\n  "name": "${options.projectName}"\n}\n`)
    return context
  }

  it(`presents a DIY ${compose.name} api`, async () => {
    const volume = new Volume()
    await compose([generatorOne, generatorTwo])({
      projectName: "my-project",
    })({ volume })

    expect(volume.toJSON()).toMatchObject({
      "/README.md": "# my-project\n",
      "/package.json": `{\n  "name": "my-project"\n}\n`,
    })
  })

  it(`presents a dotchained "apply.generators(...)" api`, async () => {
    const { volume } = await apply
      .generators([generatorOne, generatorTwo])
      .withOptions({ projectName: "my-dotchained-project" })

    expect(volume.toJSON()).toMatchObject({
      "/README.md": "# my-dotchained-project\n",
      "/package.json": `{\n  "name": "my-dotchained-project"\n}\n`,
    })
  })
})

