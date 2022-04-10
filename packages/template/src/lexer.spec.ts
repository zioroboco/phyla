import { test } from "mocha"
import expect from "expect"

import { TokenType } from "./types"
import { lex } from "./lexer"

test(`single line, static content`, () => {
  const input = `thing one`
  const tokens = lex(input)
  expect(tokens).toHaveLength(1)
  expect(tokens).toMatchObject([
    {
      type: TokenType.StaticLine,
      image: "thing one",
    },
  ])
})

test(`multiple lines, static content`, () => {
  const input = `thing one\nthing two\nthing three`
  const tokens = lex(input)
  expect(tokens).toHaveLength(3)
  expect(tokens).toMatchObject([
    {
      type: TokenType.StaticLine,
      image: "thing one\n",
    },
    {
      type: TokenType.StaticLine,
      image: "thing two\n",
    },
    {
      type: TokenType.StaticLine,
      image: "thing three",
    },
  ])
})

test(`single line, placeholder only`, () => {
  const input = `{{ blep }}`
  const tokens = lex(input)
  expect(tokens).toHaveLength(1)
  expect(tokens).toMatchObject([
    {
      type: TokenType.Expression,
      image: "{{ blep }}",
      value: "blep",
    },
  ])
})

test(`multiple lines, placeholder only`, () => {
  const input = `{{\n  blep\n}}`
  const tokens = lex(input)
  expect(tokens).toHaveLength(1)
  expect(tokens).toMatchObject([
    {
      type: TokenType.Expression,
      image: "{{\n  blep\n}}",
      value: "blep",
    },
  ])
})

test(`single line, prefix`, () => {
  const input = `before {{ blep }}`
  const tokens = lex(input)
  expect(tokens).toHaveLength(2)
  expect(tokens).toMatchObject([
    {
      type: TokenType.StaticPrefix,
      image: "before ",
    },
    {
      type: TokenType.Expression,
      image: "{{ blep }}",
      value: "blep",
    },
  ])
})

test(`single line, postfix`, () => {
  const input = `{{ blep }} after`
  const tokens = lex(input)
  expect(tokens).toHaveLength(2)
  expect(tokens).toMatchObject([
    {
      type: TokenType.Expression,
      image: "{{ blep }}",
      value: "blep",
    },
    {
      type: TokenType.StaticPostfix,
      image: " after",
    },
  ])
})

test(`single line, prefix and postfix`, () => {
  const input = `before {{ blep }} after`
  const tokens = lex(input)
  expect(tokens).toHaveLength(3)
  expect(tokens).toMatchObject([
    {
      type: TokenType.StaticPrefix,
      image: "before ",
    },
    {
      type: TokenType.Expression,
      image: "{{ blep }}",
      value: "blep",
    },
    {
      type: TokenType.StaticPostfix,
      image: " after",
    },
  ])
})

test(`multiple lines, empty`, () => {
  const input = `\n\n`
  const tokens = lex(input)
  expect(tokens).toHaveLength(2)
  expect(tokens).toMatchObject([
    {
      type: TokenType.StaticLine,
      image: "\n",
    },
    {
      type: TokenType.StaticLine,
      image: "\n",
    },
  ])
})

test(`nothing`, () => {
  const input = ``
  const tokens = lex(input)
  expect(tokens).toHaveLength(0)
})

test(`escaped double-curlies`, () => {
  const input = `() => <Thing prop=\\{\\{ shrug: true \\}\\} />`
  const tokens = lex(input)
  expect(tokens).toHaveLength(1)
  expect(tokens).toMatchObject([
    {
      type: TokenType.StaticLine,
      image: `() => <Thing prop=\\{\\{ shrug: true \\}\\} />`,
      value: `() => <Thing prop={{ shrug: true }} />`,
    },
  ])
})

test(`complex example`, () => {
  const input = `{
  "name": "{{ name }}"
  "author": "{{ author.name }} <{{ author.email }}>"
  "private": true,
  "scripts": {
    {{ slot: blep }}
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

  const tokens = lex(input)

  expect(tokens).toHaveLength(27)

  expect(tokens).toMatchObject([
    { type: TokenType.StaticLine,       image: "{\n" },
    { type: TokenType.StaticPrefix,     image: "  \"name\": \"" },
    { type: TokenType.Expression,       image: "{{ name }}", value: "name" },
    { type: TokenType.StaticPostfix,    image: "\"\n" },
    { type: TokenType.StaticPrefix,     image: "  \"author\": \"" },
    { type: TokenType.Expression,       image: "{{ author.name }}", value: "author.name" },
    { type: TokenType.StaticPrefix,     image: " <" },
    { type: TokenType.Expression,       image: "{{ author.email }}", value: "author.email" },
    { type: TokenType.StaticPostfix,    image: ">\"\n" },
    { type: TokenType.StaticLine,       image: "  \"private\": true,\n" },
    { type: TokenType.StaticLine,       image: "  \"scripts\": {\n" },
    { type: TokenType.StaticPrefix,     image: "    " },
    { type: TokenType.SlotExpression,   image: "{{ slot: blep }}", value: "blep" },
    { type: TokenType.StaticPostfix,    image: "\n" },
    { type: TokenType.StaticLine,       image: "    \"test\": \"mocha\"\n" },
    { type: TokenType.StaticLine,       image: "  },\n" },
    { type: TokenType.StaticLine,       image: "  \"workspaces\": [\n" },
    { type: TokenType.StaticPrefix,     image: "    \"" },
    { type: TokenType.SpreadExpression, image: "{{ ...workspaces }}", value: "workspaces" },
    { type: TokenType.StaticPostfix,    image: "\",\n" },
    { type: TokenType.StaticLine,       image: "  ],\n" },
    { type: TokenType.StaticLine,       image: "  \"dependencies: {\n" },
    { type: TokenType.StaticPrefix,     image: "    " },
    { type: TokenType.SpreadExpression, image: "{{\n      ...dependencies.map(([package, version]) => {\n        return `\"${package}\": \"${version}\"`\n      })\n    }}", value: "dependencies.map(([package, version]) => {\n        return `\"${package}\": \"${version}\"`\n      })" },
    { type: TokenType.StaticPostfix,    image: ",\n" },
    { type: TokenType.StaticLine,       image: "  }\n" },
    { type: TokenType.StaticLine,       image: "}" },
  ])
})
