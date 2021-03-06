import * as phyla from "@phyla/core"
import { expect } from "expect"
import * as path from "path"
import { $, cd } from "zx"

export default phyla.task(() => ({
  run: async ctx => {
    await cd(ctx.cwd)
    await $`echo "# replace me with a real install!" > pnpm-lock.yaml`
  },

  post: ({ it }, { cwd, fs }) => [
    it(`worked`, async () => {
      const lockfile = await fs.promises.readFile(
        path.join(cwd, "pnpm-lock.yaml"),
        "utf8",
      )
      expect(lockfile).toMatch("install")
    }),
  ],
}))
