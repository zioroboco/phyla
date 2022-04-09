import assert from "assert"
import moo from "moo"

export interface Token extends moo.Token {
  type: TokenType
}

export enum TokenType {
  Expression = "Expression",
  SlotExpression = "SlotExpression",
  SpreadExpression = "SpreadExpression",
  StaticLine = "StaticLine",
  StaticPostfix = "StaticPostfix",
  StaticPrefix = "StaticPrefix",
}

const lexer = moo.compile({
  [TokenType.SlotExpression]: {
    match: /{{[ ]*slot:[ ]*\w+[ ]*}}/,
    lineBreaks: false,
  },
  [TokenType.SpreadExpression]: {
    match: /{{[ \t\n]*\.{3}[a-zA-Z$_](?:.|\n)*?}}/,
    lineBreaks: true,
  },
  [TokenType.Expression]: {
    match: /{{(?:.|\n)+?}}/,
    lineBreaks: true,
  },
  [TokenType.StaticPrefix]: {
    match: /.+?(?={{)/,
    lineBreaks: false,
  },
  [TokenType.StaticPostfix]: {
    match: /(?<=}}).*\n?/,
    lineBreaks: true,
  },
  [TokenType.StaticLine]: {
    match: /\n|.+\n?/,
    lineBreaks: true,
  },
})

export function lex (input: string): Token[] {
  const acc: Token[] = []

  for (const token of lexer.reset(input)) {
    assert.ok(token.type, `token.type had value ${token.type}`)

    let value = token.text

    if (
      [
        TokenType.Expression,
        TokenType.SlotExpression,
        TokenType.SpreadExpression,
      ].some(t => t === token.type)
    ) {
      value = value.replace(/^{{[ \t\n]*/, "").replace(/[ \t\n]*}}$/, "")
    }

    if (token.type === TokenType.SpreadExpression) {
      value = value.replace(/^\.{3}/, "")
    }

    if (token.type === TokenType.SlotExpression) {
      value = value.replace(/^slot:[ ]*/, "")
    }

    value = value.replace(/\\{\\{/, "{{").replace(/\\}\\}/, "}}")

    acc.push({ ...token, value } as Token)
  }

  return acc
}
