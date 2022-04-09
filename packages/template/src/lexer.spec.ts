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
      tokenType: { name: TokenType.Placeholder },
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
      tokenType: { name: TokenType.Placeholder },
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
      tokenType: { name: TokenType.Placeholder },
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
      tokenType: { name: TokenType.StaticEmpty },
      image: "\n",
    },
    {
      tokenType: { name: TokenType.StaticEmpty },
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
