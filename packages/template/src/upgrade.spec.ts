import expect from "expect"
import { describe, it } from "mocha"

import { upgrade, VersionArgs } from "./upgrade"

describe(upgrade.name, () => {
  const content = `{
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
}`

  const prev: VersionArgs = {
    variables: {
      name: "my-package",
      author: {
        name: "Blep B. Leppington",
        email: "b.lep@example.com",
      },
      workspaces: [
        "workspace-one",
        "workspace-two",
      ],
      dependencies: [
        ["package-one", "1.0.0"],
        ["package-two", "2.0.0"],
      ],
    },
    template: `{
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
  }

  const next: VersionArgs = {
    variables: {
      package: { name: prev.variables!.name },
      author: {
        name: "Blep B. Leppington",
        email: "b.lep@example.com",
      },
      workspaces: ["workspace-one", "workspace-two"],
      dependencies: [
        ["package-one", "1.0.0"],
        ["package-two", "2.0.0"],
      ],
    },
    template: `{
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
  }

  const expected = `{
  "name": "@org/my-package"
  "description": "",
  "author": "Blep B. Leppington <b.lep@example.com>"
  "private": false,
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
}`

  const mapSlotNames = (name: string) => name === "stuff" ? "scripts" : name

  it(`upgrades the templated content`, () => {
    expect(upgrade({ content, prev, next, mapSlotNames })).toMatchObject({
      right: expected,
    })
  })
})
