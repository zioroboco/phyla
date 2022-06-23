import expect from "expect"
import { describe, it } from "mocha"

import * as E from "fp-ts/Either"
import { identity, pipe } from "fp-ts/lib/function"
import { render, withSlotNodes } from "./render"
import { NodeType, TokenType } from "./types"

const template = `{
  "name": "{{ name }}"
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

const variables = {
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
}

const slots = {
  scripts: `"lint": "eslint src",`,
  dependencies: `"package-three": "3.0.0",`,
}

describe(render.name, () => {
  it("renders template to the expected string", () => {
    const result = pipe(
      render(template, {
        variables,
        slots,
      }),
      E.fold(err => {
        throw new Error(err.message)
      }, identity),
    )

    expect(result).toMatch(`{
  "name": "my-package"
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
}`)
  })
})

describe(withSlotNodes.name, () => {
  it("renders template to the array", () => {
    const result = pipe(
      withSlotNodes(template, {
        variables,
      }),
      E.fold(err => {
        throw new Error(err.message)
      }, identity),
    )

    expect(result).toEqual([
      `{
  "name": "my-package"
  "author": "Blep B. Leppington <b.lep@example.com>"
  "private": true,
  "scripts": {
    `,
      {
        type: NodeType.Slot,
        token: expect.objectContaining({
          type: TokenType.Slot,
          value: "scripts",
        }),
      },
      `
    "test": "mocha"
  },
  "workspaces": [
    "workspace-one",
    "workspace-two",
  ],
  "dependencies: {
    "package-one": "1.0.0",
    "package-two": "2.0.0",
    `,
      {
        type: NodeType.Slot,
        token: expect.objectContaining({
          type: TokenType.Slot,
          value: "dependencies",
        }),
      },
      `
  }
}`,
    ])
  })
})
