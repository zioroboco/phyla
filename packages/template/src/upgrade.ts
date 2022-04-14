import * as E from "fp-ts/Either"
import { fromPairs, zip } from "ramda"
import { identity, pipe } from "fp-ts/function"

import { ParseError } from "./parse"
import { SlotNode } from "./types"
import { Variables, render, withSlotNodes } from "./render"

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
  ).slice(1, -1)

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
