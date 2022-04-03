import * as phyla from "@phyla/core"
import { Volume, createFsFromVolume } from "memfs"
import { test } from "mocha"
import expect from "expect"
import licenseTask, { LicenseTaskParameters } from "./license"

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

  const params: LicenseTaskParameters = {
    author: "Blep B. Leppington",
    license: "MIT",
  }

  await phyla.run(licenseTask(params), {
    // @ts-ignore
    fs: createFsFromVolume(volume),
    cwd,
    stack: [],
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

  expect(renderedLicense).toMatch("Copyright 2022 Blep B. Leppington")
  expect(renderedLicense).toMatch("Permission is hereby granted")
})
