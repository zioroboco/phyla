import { ServerActions, ServerConfig, Watcher, serverMachine, watcherMachine } from "./services"
import { assign, interpret, spawn } from "xstate"
import { expect, jest, test } from "@jest/globals"
import { fromPairs } from "ramda"

test("server", async () => {
  const mocks = {
    initialiseProject: jest.fn(),
    applyPipeline: jest.fn(),
    openEditor: jest.fn(),
    syncProject: jest.fn(),
  } as Record<Partial<ServerActions["type"]>, ReturnType<typeof jest.fn>>

  const serverConfig: ServerConfig = {
    actions: {
      ...mocks,
      spawnWatchers: context => {
        context.watchers = [
          spawn(watcherMachine, { sync: true }),
        ]
      },
    },
  }

  const server = interpret(serverMachine.withConfig(serverConfig))

  server.start()

  let { watchers } = server.state.context
  expect(watchers).toHaveLength(1)

  expect(server.state.value).toBe("initialising")
  expect(mocks.initialiseProject).toHaveBeenCalled()
  expect(watchers[0].getSnapshot().value).toBe("waiting")

  server.send({ type: "APPLY" })
  expect(server.state.value).toBe("applying")
  expect(mocks.applyPipeline).toHaveBeenCalled()

  expect(mocks.openEditor).not.toHaveBeenCalled()

  server.send({ type: "READY" })
  expect(server.state.value).toBe("watching")
  expect(mocks.openEditor).toHaveBeenCalled()

  server.send({ type: "SYNC" })
  expect(server.state.value).toBe("syncing")
  expect(mocks.syncProject).toHaveBeenCalled()
  expect(watchers[0].getSnapshot().value).toBe("waiting")

  server.send({ type: "APPLY" })
  expect(server.state.value).toBe("applying")
  expect(mocks.applyPipeline).toHaveBeenCalledTimes(2)
})
