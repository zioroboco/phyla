import * as phyla from "@phyla/core"
import { Volume, createFsFromVolume } from "memfs"
import { test } from "mocha"
import expect from "expect"
import packageTask, { PackageTaskParameters } from "./package"

const cwd = "/my-project"

test(`the happy path`, async () => {
  const volume = Volume.fromJSON({}, cwd)

  const params: PackageTaskParameters = {
    name: "@org/test-package",
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
    version: "FIXME",
    author: "FIXME",
    dependencies: {},
  })
})
