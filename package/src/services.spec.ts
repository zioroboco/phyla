import { ServerConfig, serverActions, serverMachine } from "./services"
import { expect, jest, test } from "@jest/globals"
import { fromPairs } from "ramda"
import { interpret } from "xstate"

test("server", () => {
  // @ts-ignore
  const mocks: Record<typeof serverActions[number], ReturnType<typeof jest.fn>>
    = fromPairs(serverActions.map(action => [action, jest.fn()]))

  const serverConfig: ServerConfig = {
    actions: mocks as ServerConfig["actions"],
  }

  const server = interpret(serverMachine.withConfig(serverConfig))

  server.start()

  expect(server.state.value).toBe("initialising")
  expect(mocks.spawnWatchers).toHaveBeenCalled()
  expect(mocks.initialiseProject).toHaveBeenCalled()

  server.send({ type: "APPLY" })
  expect(server.state.value).toBe("applying")
  expect(mocks.applyPipeline).toHaveBeenCalled()

  expect(mocks.openEditor).not.toHaveBeenCalled()

  server.send({ type: "READY" })
  expect(server.state.value).toBe("watching")
  expect(mocks.openEditor).toHaveBeenCalled()
  expect(mocks.startWatchers).toHaveBeenCalled()

  server.send({ type: "SYNC" })
  expect(server.state.value).toBe("syncing")
  expect(mocks.syncProject).toHaveBeenCalled()
  expect(mocks.stopWatchers).toHaveBeenCalled()

  server.send({ type: "APPLY" })
  expect(server.state.value).toBe("applying")
  expect(mocks.applyPipeline).toHaveBeenCalledTimes(2)
})
