import { Options, license } from "./license"
import { Volume, createFsFromVolume } from "memfs"
import { expect, test } from "@jest/globals"
import { fromPairs, toPairs } from "ramda"
import { run } from "begat"

const cwd = "/my-project"

test(`the happy path`, async () => {
  const volume = Volume.fromJSON(
    {
      "package.json": JSON.stringify({
        name: "test",
        version: "1.0.0",
        author: "blep",
      }),
    },
    cwd
  )

  const options: Options = {
    author: "Blep B. Leppington",
    license: "MIT",
  }

  await run(license(options), {
    // @ts-ignore
    fs: createFsFromVolume(volume),
    cwd,
    pipeline: { next: [], prev: [] },
  })

  const output = volume.toJSON()

  const renderedPackageJson = JSON.parse(String(output[`${cwd}/package.json`]))

  expect(renderedPackageJson).toMatchObject({
    name: "test",
    version: "1.0.0",
    author: "Blep B. Leppington",
    license: "MIT",
  })

  const renderedLicense = String(output[`${cwd}/LICENSE`])

  expect(renderedLicense).toMatchInlineSnapshot(`
    "Copyright 2022 Blep B. Leppington

    Permission is hereby granted, free of charge, to any person obtaining a copy of
    this software and associated documentation files (the \\"Software\\"), to deal in
    the Software without restriction, including without limitation the rights to
    use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
    the Software, and to permit persons to whom the Software is furnished to do so,
    subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED \\"AS IS\\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
    FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
    COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
    IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
    CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
    "
  `)
})
