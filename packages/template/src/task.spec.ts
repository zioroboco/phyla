import { Volume, createFsFromVolume } from "memfs"
import { describe, it } from "mocha"
import { fromPairs, repeat, zip } from "ramda"
import expect from "expect"

import { Context } from "@phyla/core"
import { getVersionedTemplates, withOuterFS } from "./task"

describe(getVersionedTemplates.name, () => {
  function withData (paths: string[]): { [key: string]: string } {
    return fromPairs(zip(paths, repeat("data!", paths.length)))
  }

  describe(`with versioned templates`, () => {
    const versions = ["0.0.0", "1.0.0", "2.0.0", "3.0.0", "latest"]

    const relativePaths = ["deep", null].flatMap(inner =>
      ["a", "b", "c"].map(
        file => [inner, file].filter(Boolean).join("/") + ".md.template"
      )
    )

    const fullPaths = versions.flatMap(dir =>
      relativePaths.map(path => "/templates/" + [dir, path].join("/"))
    )

    const vol = Volume.fromJSON({
      ...withData(fullPaths),
    })

    // @ts-ignore
    const fs = createFsFromVolume(vol) as typeof import("fs")

    it(`returns templates organised by version`, async () => {
      const result = await getVersionedTemplates(fs, "/templates", versions)
      expect(result).toMatchObject({
        "0.0.0": withData(relativePaths),
        "1.0.0": withData(relativePaths),
        "2.0.0": withData(relativePaths),
        "3.0.0": withData(relativePaths),
        latest: withData(relativePaths),
      })
    })
  })
})

describe(`the package.json example`, () => {
  const vol_outer = Volume.fromJSON({
    "templates/0.1.0/package.json.template": `{
  "name": "{{ name }}"
  "description": "{{ slot: description }}",
  "author": "{{ author.name }} <{{ author.email }}>"
  "private": true,
  "scripts": {
    {{ slot: stuff }}
    "test": "mocha"
  },
  "workspaces": [
    "{{ ...workspaces }}",
  ],
  "dependencies: {
    {{
      ...dependencies.map(([package, version]) => {
        return \`"\${package}": "\${version}"\`
      })
    }},
    {{ slot: dependencies }}
  }
}`,
    "templates/latest/package.json.template": `{
  "name": "@org/{{ package.name }}"
  "description": "{{ slot: description }}",
  "author": "{{ author.name }} <{{ author.email }}>"
  "private": false,
  "scripts": {
    {{ slot: scripts }}
    "test": "mocha"
  },
  "workspaces": [
    "{{ ...workspaces }}",
  ],
  "dependencies: {
    {{
      ...dependencies.map(([package, version]) => {
        return \`"\${package}": "\${version}"\`
      })
    }},
    {{ slot: dependencies }}
  }
}`,
  })

  // @ts-ignore
  const fs_outer = createFsFromVolume(vol_outer) as typeof import("fs")
  const task = withOuterFS(fs_outer)

  const vol_inner = Volume.fromJSON({
    "/workspace/package.json": `{
  "name": "my-package"
  "description": "",
  "author": "Blep B. Leppington <b.lep@example.com>"
  "private": true,
  "scripts": {
    "lint": "eslint src",
    "test": "mocha"
  },
  "workspaces": [
    "workspace-one",
    "workspace-two",
  ],
  "dependencies: {
    "package-one": "1.0.0",
    "package-two": "2.0.0",
    "package-three": "3.0.0",
  }
}`,
  })

  // @ts-ignore
  const fs_inner = createFsFromVolume(vol_inner) as typeof import("fs")
  const ctx = { cwd: "/project", fs: fs_inner } as Context

  const variables = {
    package: { name: "my-package" },
    author: {
      name: "Blep B. Leppington",
      email: "b.lep@example.com",
    },
    workspaces: ["workspace-one", "workspace-two"],
    dependencies: [
      ["package-one", "1.0.0"],
      ["package-two", "2.0.0"],
    ],
  }


  describe(task.name, () => {
    it(`works`, async () => {
      await task(ctx, {
        templates: "templates",
        variables,
      })
    })
  })
})
