import { Volume, fsFromVolume, globFromVolume, hashVolume } from "./volume"

describe(fsFromVolume.name, () => {
  const volume = Volume.fromJSON({ thing: "data" })

  it("returns a filesystem", () => {
    expect(fsFromVolume(volume)).toBeDefined()
  })

  it("returns a filesystem with the correct data", async () => {
    const data = await fsFromVolume(volume).readFile("thing")
    expect(data.toString()).toEqual("data")
  })
})

describe(globFromVolume.name, () => {
  describe(`when passed an empty volume`, () => {
    const glob = globFromVolume(Volume.fromJSON({}))

    it(`returns an empty array`, async () => {
      expect(await glob("**/*")).toEqual([])
    })
  })

  describe(`when passed a volume containing files`, () => {
    const glob = globFromVolume(
      Volume.fromJSON({
        "/one.txt": "data-one",
        "/stuff/two.txt": "data-two",
        "/stuff/three.txt": "data-three",
      })
    )

    it(`returns an array of the file paths`, async () => {
      expect(await glob("**/*")).toMatchObject(
        expect.arrayContaining([
          "/one.txt",
          "/stuff/two.txt",
          "/stuff/three.txt",
        ])
      )
    })
  })
})

describe(hashVolume.name, () => {
  describe(`when pased a volume containing files`, () => {
    const volume = Volume.fromJSON({
      "/one.txt": "data-one",
      "/stuff/two.txt": "data-two",
      "/stuff/three.txt": "data-three",
    })

    it(`hashes all files in the volume`, async () => {
      expect(await hashVolume(volume)).toMatchInlineSnapshot(`
        Object {
          "/one.txt": "d536d3d5632462ec52df33e95136863436b0c4e6",
          "/stuff/three.txt": "01e1743c2ba4015b2369595a32ad2db358328e0b",
          "/stuff/two.txt": "9ac6ae9f17b8d096fdd9457f8f0a8720510837a9",
        }
      `)
    })
  })
})
