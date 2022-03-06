import * as path from "path"

import { $, cd } from "zx"
import { task } from "@phyla/core"
import expect from "expect"

export default task(() => ({
  name: "@phyla/example-install",

  run: async ctx => {
    await cd(ctx.cwd)
    await $`echo "# replace me with a real install!" > pnpm-lock.yaml`
  },

  post: ({ it }, { cwd, fs }) => [
    it(`worked`, async () => {
      const lockfile = await fs.promises.readFile(
        path.join(cwd, "pnpm-lock.yaml"),
        "utf8"
      )
      expect(lockfile).toMatch("install")
    }),
  ],
}))
