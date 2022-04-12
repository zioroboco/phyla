import { describe, it } from "mocha"
import expect from "expect"

import * as E from "fp-ts/Either"
import { identity, pipe } from "fp-ts/lib/function"
import { render } from "./renderer"

it("renders a template", () => {
  const template = `{
  "name": "{{ name }}"
  "author": "{{ author.name }} <{{ author.email }}>"
  "private": true,
  "scripts": {
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
  }
}`

  const result = pipe(
    render(template, {
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
    }),
    E.fold(
      () => {
        throw new Error("unexpected error")
      },
      identity
    )
  )

  expect(result).toMatch(`{
  "name": "my-package"
  "author": "Blep B. Leppington <b.lep@example.com>"
  "private": true,
  "scripts": {
    "test": "mocha"
  },
  "workspaces": [
    "workspace-one",
    "workspace-two",
  ],
  "dependencies: {
    "package-one": "1.0.0",
    "package-two": "2.0.0",
  }
}`)
})
