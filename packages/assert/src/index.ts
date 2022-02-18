export const Pass = Symbol("Pass")

export type TestOutcome = typeof Pass | Error
export type BlockOutcome = Array<Result<BlockOutcome> | Result<TestOutcome>>

export type Result<T = TestOutcome | BlockOutcome> = {
  description: string
  duration: number
  outcome: T
}

export type Test = Promise<Result<TestOutcome>>
export type Block = Promise<Result<BlockOutcome>>

type Thunk = () => void | Promise<void>

export async function it (description: string, thunk: Thunk): Test {
  return new Promise(async res => {
    const result = { description } as Result<TestOutcome>
    const start = Date.now()
    try {
      await thunk()
      result.outcome = Pass
    } catch (e: unknown) {
      result.outcome = e instanceof Error ? e : new Error(String(e))
    }
    result.duration = Date.now() - start
    res(result)
  })
}

function assert <V> (description: string, setup: () => V | Promise<V>) {
  return (run: (variables: V) => Array<Test | Block>): Block => {
    return new Promise(async res => {
      const start = Date.now()
      const results = await Promise.all(run(await setup()))
      res({
        description,
        duration: Date.now() - start,
        outcome: results,
      })
    })
  }
}

function setup (description: string) {
  return <V = {}>(fn: () => V | Promise<V>) => ({
    assert: assert<V>(description, fn),
  })
}

export function describe (description: string) {
  return {
    setup: setup(description),
    assert: assert(description, () => ({})),
  }
}

type FlatResult = {
  descriptions: string[]
  duration: number
  outcome: TestOutcome
}

export type Report = {
  duration: number
  failures: number
  results: FlatResult[]
}

function flatten (results: Result[], descriptions: string[] = []): FlatResult[] {
  const rv: FlatResult[] = []
  for (const result of results) {
    if (Array.isArray(result.outcome)) {
      rv.push(...flatten(result.outcome, [...descriptions, result.description]))
    } else {
      rv.push({
        descriptions: [...descriptions, result.description],
        duration: result.duration,
        outcome: result.outcome,
      })
    }
  }
  return rv
}

export async function run (suite: Array<Block | Test>): Promise<Report> {
  const start = Date.now()

  const results = await Promise.all(
    suite.map(
      test =>
        new Promise<Result>(async res => {
          const result = await test
          res(result)
        })
    )
  )

  return {
    duration: Date.now() - start,
    failures: results.filter(r => r.outcome != Pass).length,
    results: flatten(results),
  }
}

function boldred (str: string) {
  return `\x1b[1m\x1b[31m${str}\x1b[0m`
}

function red (str: string) {
  return `\x1b[31m${str}\x1b[0m`
}

function green (str: string) {
  return `\x1b[32m${str}\x1b[0m`
}

function grey (str: string) {
  return `\x1b[90m${str}\x1b[0m`
}
