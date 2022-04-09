import { TokenType, lex } from "./lexer"
import { test } from "mocha"
import expect from "expect"

test(`single line, static content`, () => {
  const input = `thing one`
  const tokens = lex(input)
  expect(tokens).toHaveLength(1)
  expect(tokens).toMatchObject([
    {
      type: TokenType.StaticLine,
      text: "thing one",
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
      text: "thing one\n",
    },
    {
      type: TokenType.StaticLine,
      text: "thing two\n",
    },
    {
      type: TokenType.StaticLine,
      text: "thing three",
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
      text: "{{ blep }}",
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
      text: "{{\n  blep\n}}",
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
      text: "before ",
    },
    {
      type: TokenType.Expression,
      text: "{{ blep }}",
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
      text: "{{ blep }}",
      value: "blep",
    },
    {
      type: TokenType.StaticPostfix,
      text: " after",
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
      text: "before ",
    },
    {
      type: TokenType.Expression,
      text: "{{ blep }}",
      value: "blep",
    },
    {
      type: TokenType.StaticPostfix,
      text: " after",
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
      text: "\n",
    },
    {
      type: TokenType.StaticLine,
      text: "\n",
    },
  ])
})

test(`nothing`, () => {
  const input = ``
  const tokens = lex(input)
  expect(tokens).toHaveLength(0)
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
    { type: TokenType.StaticLine,       text: "{\n" },
    { type: TokenType.StaticPrefix,     text: "  \"name\": \"" },
    { type: TokenType.Expression,       text: "{{ name }}", value: "name" },
    { type: TokenType.StaticPostfix,    text: "\"\n" },
    { type: TokenType.StaticPrefix,     text: "  \"author\": \"" },
    { type: TokenType.Expression,       text: "{{ author.name }}", value: "author.name" },
    { type: TokenType.StaticPrefix,     text: " <" },
    { type: TokenType.Expression,       text: "{{ author.email }}", value: "author.email" },
    { type: TokenType.StaticPostfix,    text: ">\"\n" },
    { type: TokenType.StaticLine,       text: "  \"private\": true,\n" },
    { type: TokenType.StaticLine,       text: "  \"scripts\": {\n" },
    { type: TokenType.StaticPrefix,     text: "    " },
    { type: TokenType.SlotExpression,   text: "{{ slot: blep }}", value: "blep" },
    { type: TokenType.StaticPostfix,    text: "\n" },
    { type: TokenType.StaticLine,       text: "    \"test\": \"mocha\"\n" },
    { type: TokenType.StaticLine,       text: "  },\n" },
    { type: TokenType.StaticLine,       text: "  \"workspaces\": [\n" },
    { type: TokenType.StaticPrefix,     text: "    \"" },
    { type: TokenType.SpreadExpression, text: "{{ ...workspaces }}", value: "workspaces" },
    { type: TokenType.StaticPostfix,    text: "\",\n" },
    { type: TokenType.StaticLine,       text: "  ],\n" },
    { type: TokenType.StaticLine,       text: "  \"dependencies: {\n" },
    { type: TokenType.StaticPrefix,     text: "    " },
    { type: TokenType.SpreadExpression, text: "{{\n      ...dependencies.map(([package, version]) => {\n        return `\"${package}\": \"${version}\"`\n      })\n    }}", value: "dependencies.map(([package, version]) => {\n        return `\"${package}\": \"${version}\"`\n      })" },
    { type: TokenType.StaticPostfix,    text: ",\n" },
    { type: TokenType.StaticLine,       text: "  }\n" },
    { type: TokenType.StaticLine,       text: "}" },
  ])
})
