import * as E from "fp-ts/Either"
import { fromPairs, zip } from "ramda"
import { inspect } from "util"
import { pipe } from "fp-ts/function"

import { BlockNode, NodeType, SlotNode, SpreadNode, TokenType } from "./types"
import { ParseError, parse } from "./parser"
import { identity } from "fp-ts/function"
import { lex } from "./lexer"

type Variables = { [key: string]: unknown }
type Slots = { [key: string]: string } | ((key: string) => string)

export function render (
  template: string,
  options?: { variables?: Variables, slots?: Slots }
): E.Either<ParseError, string> {
  return pipe(
    template,
    lex,
    parse,
    E.map(ast =>
      ast.map(node => {
        switch (node.type) {
          case NodeType.Block:
            return evaluateBlock(node, options?.variables ?? {})
          case NodeType.Spread:
            return evaluateSpread(node, options?.variables ?? {})
          case NodeType.Slot:
            if (options?.slots) {
              return typeof options.slots === "function"
                ? options.slots(node.token.value)
                : options.slots[node.token.value]
            } else {
              return ""
            }
        }
      })
    ),
    E.map(lines => lines.join(""))
  )
}

export function withSlotNodes (
  template: string,
  options?: { variables?: Variables }
): E.Either<ParseError, Array<string | SlotNode>> {
  return pipe(
    template,
    lex,
    parse,
    E.map(ast =>
      ast.map(node => {
        switch (node.type) {
          case NodeType.Block:
            return evaluateBlock(node, options?.variables ?? {})
          case NodeType.Spread:
            return evaluateSpread(node, options?.variables ?? {})
          case NodeType.Slot:
            return node
        }
      })
    ),
    E.map(rendered =>
      rendered
        .reduce<Array<string | SlotNode>>(
        ([head, ...rest], next) =>
          typeof next === "string" && typeof head === "string"
            ? [head + next, ...rest].filter(Boolean)
            : [next, head, ...rest],
        []
      )
        .reverse()
    )
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

function throwParseError<T> (a: E.Either<ParseError, T>): T {
  return pipe(
    a,
    E.fold(
      error => {
        throw new Error(`error parsing template: ${error.message}`)
      },
      identity
    )
  )
}

export function upgrade ({
  content,
  prev,
  next,
}: {
  content: string
  prev: { template: string; variables?: Variables }
  next: { template: string; variables?: Variables }
}): E.Either<ParseError, string> {
  const SEPARATOR = "⍼⍼" // string with no legitimate right to exist
  const prevTemplateChunks = pipe(
    render(prev.template, {
      variables: prev.variables,
      slots: () => SEPARATOR,
    }),
    throwParseError,
    chunks => chunks.split(SEPARATOR),
  )

  const slotContentChunks = prevTemplateChunks.reduce<string[]>(
    (acc, templateChunk) => {
      return acc.length > 0
        ? [...acc.slice(0, -1), ...acc[acc.length - 1].split(templateChunk)]
        : content.split(templateChunk)
    },
    []
  ).filter(Boolean)

  const slotContentByName = pipe(
    withSlotNodes(prev.template, { variables: prev.variables }),
    throwParseError,
    entries => entries.filter(node => typeof node !== "string"),
    entries => entries.map(entry => (entry as SlotNode).token.value),
    names => fromPairs(zip(names, slotContentChunks)),
  )

  return render(next.template, {
    variables: next.variables,
    slots: name => slotContentByName[name],
  })
}
