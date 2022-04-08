import * as E from "fp-ts/Either"
import assert from "assert"
import moo from "moo"

const lexer = moo.compile({
  static: { match: /[^(?:{{)]+/, lineBreaks: true },
  expression: { match: /{{[ \t\n]*[^slot: ?][_$a-zA-Z].*?[ \t\n]*}}/, lineBreaks: true },
  spread: { match: /{{[ \t\n]*\.{3}[_$a-zA-Z].+?[ \t\n]*}}/, lineBreaks: true },
  slot: /{{[ ]*slot: ?\w+[ ]*}}/,
})

const tokens = ["static", "expression", "spread", "slot"] as const

type Token = {
  type: typeof tokens[number]
  value: string
  text: string
  line: number
  col: number
}

export function lex (input: string): E.Either<Error, Token[]> {
  try {
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
          .replace(/^{{[ \t\n]*/, "")
          .replace(/[ \t\n]*}}$/, "")
          .replace(/^\.{3}/, "")
          .replace(/^slot:[ ]*/, ""),
        text: token.text,
        col: token.col,
        line: token.line,
      })
    }
    return E.right(result)
  } catch (e) {
    return E.left(e instanceof Error ? e : new Error(String(e)))
  }
}
