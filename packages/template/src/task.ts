import * as E from "fp-ts/Either"
import * as fs_system from "fs"
import { fromPairs, tail, toPairs, zip } from "ramda"
import { join, resolve } from "path"
import glob from "fast-glob"
import semver from "semver"

import { Context } from "@phyla/core"
import { Variables } from "./types"
import { render } from "./render"
import { upgrade } from "./upgrade"

type FS = typeof import("fs")
const LATEST = "latest"

type Options = {
  templates: string
  variables: Variables,
}

type VersionedTemplates = { [version: string]: { [path: string]: string } }

export function withOuterFS (fs: FS) {
  return async function task (ctx: Context, options: Options) {
    try {
      const base = resolve(options.templates)
      const versions = await glob("*", { cwd: base, fs, onlyDirectories: true })
      const versionedTemplates = await getVersionedTemplates(fs, base, versions)

      if (!versionedTemplates[LATEST]) {
        throw new Error(`No directory '${LATEST}' found in ${base}`)
      }

      const latestTemplateResults = toPairs(versionedTemplates[LATEST]).map(
        ([path, content]) => [
          path,
          render(content, { variables: options.variables }),
        ] as const
      )

    } catch (e) {
      throw e
    }
  }
}

export const task = withOuterFS(fs_system)

function semverValidate (version: string): boolean {
  return version === LATEST || typeof semver.valid(version) === "string"
}

function semverSortAscending (versions: string[]): string[] {
  return [...semver.sort(versions.filter(v => v !== LATEST)), LATEST]
}

function adjacentPairs <A> (fa: A[]): [A, A][] {
  return zip(fa, tail(fa))
}

export async function getVersionedTemplates (
  fs: FS,
  basedir: string,
  versions: string[],
): Promise<VersionedTemplates> {
  return fromPairs(
    await Promise.all(
      versions.map(async version => {
        const files = await glob("**/*.template", {
          fs,
          cwd: join(basedir, version),
        })
        return [
          version,
          fromPairs(
            await Promise.all(
              files.map(async file => [
                file,
                await fs.promises.readFile(
                  join(basedir, version, file),
                  "utf8"
                ),
              ])
            )
          ),
        ]
      })
    )
  )
}
