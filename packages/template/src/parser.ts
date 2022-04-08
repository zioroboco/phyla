import assert from "assert"
import moo from "moo"

const lexer = moo.compile({
  static: { match: /[^(?:{{)]+/, lineBreaks: true },
  expression: /{{[ ]*\w+[ ]*}}/,
  spread: /{{[ ]*\.{3}\w+[ ]*}}/,
  slot: /{{[ ]*slot:[ ]*\w+[ ]*}}/,
})

const tokens = ["static", "expression", "spread", "slot"] as const

type Token = {
  type: typeof tokens[number]
  value: string
  text: string
  line: number
  col: number
}

export function lex (input: string): Token[] {
  lexer.reset(input)
  const result: Token[] = []
  for (const token of lexer) {
    assert(
      tokens.some(type => type === token.type),
      `unexpected token type: ${token.type}`
    )
    result.push({
      type: token.type as typeof tokens[number],
      value: token.value
        .replace(/^{{[ ]*/, "")
        .replace(/[ ]*}}$/, "")
        .replace(/^\.{3}/, "")
        .replace(/^slot:[ ]*/, ""),
      text: token.text,
      col: token.col,
      line: token.line,
    })
  }
  return result
}
