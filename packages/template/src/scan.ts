import assert from "assert"
import moo from "moo"

import { Token, TokenType } from "./types"

const scanner = moo.compile({
  [TokenType.Slot]: {
    match: /{{[ \t\n]*slot:[ \t\n]*\w+[ \t\n]*}}/,
    lineBreaks: false,
  },
  [TokenType.Spread]: {
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
  [TokenType.StaticSuffix]: {
    match: /(?<=}}).*\n?/,
    lineBreaks: true,
  },
  [TokenType.StaticLine]: {
    match: /\n|.+\n?/,
    lineBreaks: true,
  },
})

export function scan(template: string): Token[] {
  const acc: Token[] = []
  for (const token of scanner.reset(template)) {
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
      column: token.col,
    })
  }
  return acc
}

function isExpressionToken(token: { type?: string }): boolean {
  return [
    TokenType.Expression,
    TokenType.Slot,
    TokenType.Spread,
  ].some(t => t === token.type)
}
