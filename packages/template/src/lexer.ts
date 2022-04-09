import moo from "moo"

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

function collect (lexer: moo.Lexer): moo.Token[] {
  const acc: moo.Token[] = []
  for (const token of lexer) {
    acc.push(token)
  }
  return acc
}

export interface Token extends moo.Token {
  type: TokenType
}

export function lex (input: string): Token[] {
  return collect(lexer.reset(input)) as Token[]
}
