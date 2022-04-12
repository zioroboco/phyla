import * as E from "fp-ts/Either"
import * as O from "fp-ts/Option"
import * as RA from "fp-ts/ReadonlyArray"
import { pipe } from "fp-ts/function"

import {
  AST,
  BlockNode,
  NodeType,
  SlotNode,
  SpreadNode,
  Token,
  TokenType,
} from "./types"

export interface Input {
  readonly tokens: ReadonlyArray<Token>
  readonly index: number
}

export function Input (tokens: ReadonlyArray<Token>, index: number = 0): Input {
  return { tokens, index }
}

type Parser<A> = (input: Input) => E.Either<ParseError, readonly [A, Input]>

export interface ParseError {
  readonly message: string
  readonly input: Input
}

function ParseError (message: string, input: Input): ParseError {
  return { message, input }
}

function advance (input: Input): O.Option<[Token, Input]> {
  return input.tokens.length > input.index
    ? O.some([input.tokens[input.index], Input(input.tokens, input.index + 1)])
    : O.none
}

export function parseTokenType (expected: TokenType): Parser<Token> {
  return input =>
    pipe(
      advance(input),
      O.fold(
        () => E.left(ParseError(`unexpected end of input`, input)),
        ([token, input]) =>
          token.type === expected
            ? E.right([token, input] as const)
            : E.left(
              ParseError(
                `expected token of type ${expected}, got ${token.type}`,
                input
              )
            )
      )
    )
}

function map <A, B> (f: (a: A) => B) {
  return (fa: Parser<A>): Parser<B> =>
    (input: Input) =>
      pipe(
        fa(input),
        E.map(([a, nextInput]) => [f(a), nextInput])
      )
}

function success <A> (a: A): Parser<A> {
  return input =>
    E.right([a, input])
}

function failure (message: string): Parser<never> {
  return input =>
    E.left(ParseError(message, input))
}

export function either <A> (...fas: ReadonlyArray<Parser<A>>): Parser<A> {
  return pipe(
    fas,
    RA.foldLeft(
      () => failure("no parser succeeded"),
      (fa: Parser<A>, tail: ReadonlyArray<Parser<A>>) => input =>
        pipe(
          fa(input),
          E.fold(() => either(...tail)(input), E.right)
        )
    )
  )
}

function product<A, B> (fa: Parser<A>, fb: Parser<B>): Parser<readonly [A, B]> {
  return input =>
    pipe(
      fa(input),
      E.chain(([a, inputAfterA]) =>
        pipe(
          fb(inputAfterA),
          E.map(([b, inputAfterB]) => [[a, b] as const, inputAfterB])
        )
      )
    )
}

export function sequence<A> (
  ...fas: ReadonlyArray<Parser<A>>
): Parser<ReadonlyArray<A>> {
  return pipe(
    fas,
    RA.reduce(success<ReadonlyArray<A>>([]), (parser, fa) =>
      pipe(
        product(parser, fa),
        map(([result, a]) => RA.append(a)(result))
      )
    )
  )
}

export function many <A> (fa: Parser<A>): Parser<ReadonlyArray<A>> {
  return input =>
    pipe(
      fa(input),
      E.map(([a, inputAfterA]) => [[a], inputAfterA] as const),
      E.chain(([a, inputAfterA]) =>
        pipe(
          either(many(fa), success<ReadonlyArray<A>>([]))(inputAfterA),
          E.map(([b, inputAfterB]) => [a.concat(b), inputAfterB])
        )
      )
    )
}

export function where <A> (
  predicate: (input: Input) => boolean,
  fa: Parser<A>
): Parser<A> {
  return input =>
    pipe(
      fa(input),
      E.chain(([a, nextInput]) =>
        predicate(input)
          ? E.right([a, nextInput])
          : E.left(ParseError(`predicate is false`, nextInput))
      ))
}

export const parseSlotNode = pipe(
  parseTokenType(TokenType.Slot),
  map(
    (token: Token): SlotNode => ({
      type: NodeType.Slot,
      token,
    })
  )
)

function isNotFollowedBy (type: TokenType): (input: Input) => boolean {
  return input => pipe(
    advance(input),
    O.fold(
      () => true,
      ([_, nextInput]) => nextInput.tokens[nextInput.index].type !== type
    )
  )
}

export const parseBlockNode = pipe(
  many(
    either(
      parseTokenType(TokenType.Expression),
      parseTokenType(TokenType.StaticLine),
      parseTokenType(TokenType.StaticSuffix),
      where(
        isNotFollowedBy(TokenType.Spread),
        parseTokenType(TokenType.StaticPrefix),
      )
    )
  ),
  map(
    (tokens: readonly Token[]): BlockNode => ({
      type: NodeType.Block,
      tokens,
    })
  )
)

export const empty = {}
export function maybe <A> (parser: Parser<A>): Parser<A> {
  return input =>
    pipe(
      parser(input),
      E.fold(
        // FIXME 😬
        // The type `A` should be a monoid, and we should return a right of its
        // empty value. But I don't know how to do that yet, so here we are.
        () => E.right([empty as A, Input(input.tokens, input.index)] as const),
        ([a, nextInput]) => E.right([a, nextInput] as const)
      )
    )
}

export const parseSpreadNode = pipe(
  sequence(
    maybe(parseTokenType(TokenType.StaticPrefix)),
    parseTokenType(TokenType.Spread),
    maybe(parseTokenType(TokenType.StaticSuffix))
  ),
  map(
    ([
      prefixToken,
      spreadToken,
      suffixToken,
    ]: readonly Token[]): SpreadNode => ({
      type: NodeType.Spread,
      spreadToken,
      ...(prefixToken === empty ? {} : { prefixToken }),
      ...(suffixToken === empty ? {} : { suffixToken }),
    })
  )
)

export function parse (tokens: Token[]): E.Either<ParseError, AST> {
  return pipe(
    Input(tokens),
    many(
      either<SlotNode | BlockNode | SpreadNode>(
        parseSlotNode,
        parseBlockNode,
        parseSpreadNode
      )
    ),
    E.map(([ast, _]) => ast)
  )
}
