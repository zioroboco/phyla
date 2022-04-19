import { describe, it } from "mocha"
import expect from "expect"

import { render } from "./render"
import { upgrade } from "./upgrade"

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

  const prev = `{
  "name": "{{ package.name }}"
  "description": "{{ slot: description }}",
  "author": "{{ author.name }} <{{ author.email }}>"
  "private": true,
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
}`

  const next = `{
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
}`

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

  it(`upgrades the templated content`, () => {
    expect(upgrade({ content, prev, next, variables })).toMatchObject({
      right: expected,
    })
  })
})
