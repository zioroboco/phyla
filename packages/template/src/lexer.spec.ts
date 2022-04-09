import { TokenType, lexer } from "./lexer"
import { test } from "mocha"
import expect from "expect"

test(`single line, static content`, () => {
  const input = `blep`
  expect(lexer.tokenize(input)).toMatchObject({
    errors: [],
    tokens: [
      {
        tokenType: { name: TokenType.Static },
        image: "blep",
      },
    ],
  })
})

test(`multiple lines, static content`, () => {
  const input = `one\ntwo\nthree`
  expect(lexer.tokenize(input)).toMatchObject({
    errors: [],
    tokens: [
      {
        tokenType: { name: TokenType.Static },
        image: "one\ntwo\nthree",
      },
    ],
  })
})

test(`single line, placeholder only`, () => {
  const input = `{{ blep }}`
  expect(lexer.tokenize(input)).toMatchObject({
    errors: [],
    tokens: [
      {
        tokenType: { name: TokenType.Placeholder },
        image: "{{ blep }}",
      },
    ],
  })
})

test(`multiple lines, placeholder only`, () => {
  const input = `{{\n  blep\n}}`
  expect(lexer.tokenize(input)).toMatchObject({
    errors: [],
    tokens: [
      {
        tokenType: { name: TokenType.Placeholder },
        image: "{{\n  blep\n}}",
      },
    ],
  })
})
