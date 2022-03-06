#!/usr/bin/env node --experimental-specifier-resolution=node

import * as commands from "../dist/commands.js"
import { Cli } from "clipanion"
import { createRequire } from "module"

const packageJson = createRequire(import.meta.url)("../package.json")

const cli = new Cli({
  binaryLabel: `🧬 @phyla/core`,
  binaryName: `phyla`,
  binaryVersion: packageJson.version,
})

for (const c in commands) {
  cli.register(commands[c])
}

const [node, bin, ...args] = process.argv

cli.runExit(args)
