import assert from "assert"
import moo from "moo"

export interface Token {
  type: TokenType
  image: string
  value: string
  line: number
  col: number
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
    match: /{{[ \t\n]*slot:[ \t\n]*\w+[ \t\n]*}}/,
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
    acc.push({
      type: token.type as TokenType,
      value: isExpressionToken(token)
        ? token.text
          .replace(/^{{[ \t\n]*(?:\.{3}|slot:[ \t\n]*)?/, "")
          .replace(/[ \t\n]*}}$/, "")
        : token.text
          .replace(/\\{\\{/, "{{")
          .replace(/\\}\\}/, "}}"),
      image: token.text,
      line: token.line,
      col: token.col,
    })
  }
  return acc
}

function isExpressionToken (token: { type?: string }): boolean {
  return [
    TokenType.Expression,
    TokenType.SlotExpression,
    TokenType.SpreadExpression,
  ].some(t => t === token.type)
}
