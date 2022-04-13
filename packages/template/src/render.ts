import * as E from "fp-ts/Either"
import { inspect } from "util"
import { pipe } from "fp-ts/function"

import { BlockNode, NodeType, SpreadNode, TokenType } from "./types"
import { lex } from "./lexer"
import { parse } from "./parser"

type Variables = { [key: string]: unknown }

export function render (
  template: string,
  variables: Variables
) {
  return pipe(
    template,
    lex,
    parse,
    E.map(ast =>
      ast.map(node => {
        switch (node.type) {
          case NodeType.Block:
            return evaluateBlock(node, variables)
          case NodeType.Spread:
            return evaluateSpread(node, variables)
          default:
            throw new Error(`unexpected node type ${node.type}`)
        }
      })
    ),
    E.map(lines => lines.join(""))
  )
}

function evaluateBlock (node: BlockNode, variables: Variables): string {
  return node.tokens.map(token => {
    const evaluated =
      token.type === TokenType.Expression
        ? evaluate(token.value, variables)
        : token.value
    return evaluated
  }).join("")
}

function evaluateSpread (node: SpreadNode, variables: Variables): string {
  const evaluated = evaluate(node.spreadToken.value, variables)
  if (!Array.isArray(evaluated)) {
    throw new Error(
      `expected array result when evaluating ${inspect(node.spreadToken.value)}` +
        ` but expression returned ${inspect(evaluated)}`
    )
  }
  return evaluated
    .map(element =>
      [
        node.prefixToken?.value ?? "",
        element,
        node.suffixToken?.value ?? "",
      ].join("")
    )
    .join("")
}

function evaluate (expression: string, variables: Variables): unknown {
  const definitions = Object.keys(variables).map(
    key => `let ${key} = ${JSON.stringify(variables[key])}`
  )
  return new Function([...definitions, `return ${expression}`].join(";"))()
}
