import * as phyla from "@phyla/core"
import { Volume, createFsFromVolume } from "memfs"
import { test } from "mocha"
import expect from "expect"
import packageTask, { PackageTaskParameters } from "./index"

const cwd = "/my-project"

test(`the happy path`, async () => {
  const volume = Volume.fromJSON({}, cwd)

  const params: PackageTaskParameters = {
    name: "@org/test-package",
    dependencies: {
      "one": "1.0.0",
      "two": "2.0.0",
    },
  }

  await phyla.run(packageTask(params), {
    // @ts-ignore
    fs: createFsFromVolume(volume),
    cwd,
    stack: [],
  })

  const output = volume.toJSON()

  const renderedPackageJson = JSON.parse(String(output[`${cwd}/package.json`]))

  expect(renderedPackageJson).toMatchObject({
    name: "@org/test-package",
    private: true,
    dependencies: {
      "one": "1.0.0",
      "two": "2.0.0",
    },
  })
})
