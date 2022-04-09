import { TokenType, lexer } from "./lexer"
import { test } from "mocha"
import expect from "expect"

test(`single line, static content`, () => {
  const input = `blep`
  const { tokens, errors } = lexer.tokenize(input)
  expect(errors).toHaveLength(0)
  expect(tokens).toHaveLength(1)
  expect(tokens).toMatchObject([
    {
      tokenType: { name: TokenType.Static },
      image: "blep",
    },
  ])
})

test(`multiple lines, static content`, () => {
  const input = `one\ntwo\nthree`
  const { tokens, errors } = lexer.tokenize(input)
  expect(errors).toHaveLength(0)
  expect(tokens).toHaveLength(1)
  expect(tokens).toMatchObject([
    {
      tokenType: { name: TokenType.Static },
      image: "one\ntwo\nthree",
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
      tokenType: { name: TokenType.Placeholder },
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
      tokenType: { name: TokenType.Placeholder },
      image: "{{\n  blep\n}}",
    },
  ])
})


test(`single line, mixed`, () => {
  const input = `before {{ blep }} after`
  const { tokens, errors } = lexer.tokenize(input)
  expect(errors).toHaveLength(0)
  expect(tokens).toHaveLength(3)
  expect(tokens).toMatchObject([
    {
      tokenType: { name: TokenType.Static },
      image: "before ",
    },
    {
      tokenType: { name: TokenType.Placeholder },
      image: "{{  blep }}",
    },
    {
      tokenType: { name: TokenType.Static },
      image: " after",
    },
  ])
})
