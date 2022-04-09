import { TokenType, lexer } from "./lexer"
import { test } from "mocha"
import expect from "expect"

test(`single line, static content`, () => {
  const input = `thing one`
  const { tokens, errors } = lexer.tokenize(input)
  expect(errors).toHaveLength(0)
  expect(tokens).toHaveLength(1)
  expect(tokens).toMatchObject([
    {
      tokenType: { name: TokenType.StaticLine },
      image: "thing one",
    },
  ])
})

test(`multiple lines, static content`, () => {
  const input = `thing one\nthing two\nthing three`
  const { tokens, errors } = lexer.tokenize(input)
  expect(errors).toHaveLength(0)
  expect(tokens).toHaveLength(3)
  expect(tokens).toMatchObject([
    {
      tokenType: { name: TokenType.StaticLine },
      image: "thing one\n",
    },
    {
      tokenType: { name: TokenType.StaticLine },
      image: "thing two\n",
    },
    {
      tokenType: { name: TokenType.StaticLine },
      image: "thing three",
    },
  ])
})

test(`single line, placeholder only`, () => {
  const input = `{{ blep }}`
  const { tokens, errors } = lexer.tokenize(input)
  expect(errors).toHaveLength(0)
  expect(tokens).toHaveLength(1)
  expect(tokens).toMatchObject([
    {
      tokenType: { name: TokenType.Expression },
      image: "{{ blep }}",
    },
  ])
})

test(`multiple lines, placeholder only`, () => {
  const input = `{{\n  blep\n}}`
  const { tokens, errors } = lexer.tokenize(input)
  expect(errors).toHaveLength(0)
  expect(tokens).toHaveLength(1)
  expect(tokens).toMatchObject([
    {
      tokenType: { name: TokenType.Expression },
      image: "{{\n  blep\n}}",
    },
  ])
})

test(`single line, prefix`, () => {
  const input = `before {{ blep }}`
  const { tokens, errors } = lexer.tokenize(input)
  expect(errors).toHaveLength(0)
  expect(tokens).toHaveLength(2)
  expect(tokens).toMatchObject([
    {
      tokenType: { name: TokenType.StaticPrefix },
      image: "before ",
    },
    {
      tokenType: { name: TokenType.Expression },
      image: "{{ blep }}",
    },
  ])
})

test(`single line, postfix`, () => {
  const input = `{{ blep }} after`
  const { tokens, errors } = lexer.tokenize(input)
  expect(errors).toHaveLength(0)
  expect(tokens).toHaveLength(2)
  expect(tokens).toMatchObject([
    {
      tokenType: { name: TokenType.Expression },
      image: "{{ blep }}",
    },
    {
      tokenType: { name: TokenType.StaticPostfix },
      image: " after",
    },
  ])
})

test(`single line, prefix and postfix`, () => {
  const input = `before {{ blep }} after`
  const { tokens, errors } = lexer.tokenize(input)
  expect(errors).toHaveLength(0)
  expect(tokens).toHaveLength(3)
  expect(tokens).toMatchObject([
    {
      tokenType: { name: TokenType.StaticPrefix },
      image: "before ",
    },
    {
      tokenType: { name: TokenType.Expression },
      image: "{{ blep }}",
    },
    {
      tokenType: { name: TokenType.StaticPostfix },
      image: " after",
    },
  ])
})

test(`multiple lines, empty`, () => {
  const input = `\n\n`
  const { tokens, errors } = lexer.tokenize(input)
  expect(errors).toHaveLength(0)
  expect(tokens).toHaveLength(2)
  expect(tokens).toMatchObject([
    {
      tokenType: { name: TokenType.StaticBlankLine },
      image: "\n",
    },
    {
      tokenType: { name: TokenType.StaticBlankLine },
      image: "\n",
    },
  ])
})

test(`nothing`, () => {
  const input = ``
  const { tokens, errors } = lexer.tokenize(input)
  expect(errors).toHaveLength(0)
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

  const { tokens, errors } = lexer.tokenize(input)

  expect(errors).toHaveLength(0)
  expect(tokens).toHaveLength(27)

  expect(tokens).toMatchObject([
    { tokenType: { name: TokenType.StaticLine        }, image: "{\n" },
    { tokenType: { name: TokenType.StaticPrefix      }, image: "  \"name\": \"" },
    { tokenType: { name: TokenType.Expression        }, image: "{{ name }}" },
    { tokenType: { name: TokenType.StaticPostfix     }, image: "\"\n" },
    { tokenType: { name: TokenType.StaticPrefix      }, image: "  \"author\": \"" },
    { tokenType: { name: TokenType.Expression        }, image: "{{ author.name }}" },
    { tokenType: { name: TokenType.StaticPrefix      }, image: " <" },
    { tokenType: { name: TokenType.Expression        }, image: "{{ author.email }}" },
    { tokenType: { name: TokenType.StaticPostfix     }, image: ">\"\n" },
    { tokenType: { name: TokenType.StaticLine        }, image: "  \"private\": true,\n" },
    { tokenType: { name: TokenType.StaticLine        }, image: "  \"scripts\": {\n" },
    { tokenType: { name: TokenType.StaticPrefix      }, image: "    " },
    { tokenType: { name: TokenType.SlotExpression    }, image: "{{ slot: blep }}" },
    { tokenType: { name: TokenType.StaticPostfix     }, image: "\n" },
    { tokenType: { name: TokenType.StaticLine        }, image: "    \"test\": \"mocha\"\n" },
    { tokenType: { name: TokenType.StaticLine        }, image: "  },\n" },
    { tokenType: { name: TokenType.StaticLine        }, image: "  \"workspaces\": [\n" },
    { tokenType: { name: TokenType.StaticPrefix      }, image: "    \"" },
    { tokenType: { name: TokenType.SpreadExpression  }, image: "{{ ...workspaces }}" },
    { tokenType: { name: TokenType.StaticPostfix     }, image: "\",\n" },
    { tokenType: { name: TokenType.StaticLine        }, image: "  ],\n" },
    { tokenType: { name: TokenType.StaticLine        }, image: "  \"dependencies: {\n" },
    { tokenType: { name: TokenType.StaticPrefix      }, image: "    " },
    { tokenType: { name: TokenType.SpreadExpression  }, image: "{{\n      ...dependencies.map(([package, version]) => {\n        return `\"${package}\": \"${version}\"`\n      })\n    }}" },
    { tokenType: { name: TokenType.StaticPostfix     }, image: ",\n" },
    { tokenType: { name: TokenType.StaticLine        }, image: "  }\n" },
    { tokenType: { name: TokenType.StaticLine        }, image: "}" },
  ])
})
