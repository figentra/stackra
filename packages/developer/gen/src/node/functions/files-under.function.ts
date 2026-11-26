/**
 * Stackra file contract:
 * Purpose: `filesUnder`, every file under a folder, relative to it, `/`-separated and sorted, with dot entries
 *          (`.DS_Store`, a site's cache folders) skipped. The docs-site run lists a docs app's `src/`, a docs member's
 *          `content/` and the generated `.stackra/site/` with it.
 * Boundary: reads the file tree only; an absent folder lists nothing.
 * Runtime: node
 * Governing contract: ADR 0002 (2026-10-27 amendment); ADR 0514 (amendment of 2026-11-09).
 */
import { existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * The files under `folder`.
 *
 * @param folder - the folder to list.
 * @param base - the folder the paths are relative to; `folder` itself by default.
 * @example
 * filesUnder("/repo/docs/content"); // ["assets/logo.svg", "guides/setup.mdx", "index.mdx", "meta.json"]
 */
export function filesUnder(folder: string, base = folder): string[] {
  if (!existsSync(folder)) return [];
  return (
    readdirSync(folder, { withFileTypes: true })
      .filter((entry) => !entry.name.startsWith("."))
      .flatMap((entry) =>
        entry.isDirectory()
          ? filesUnder(join(folder, entry.name), base)
          : [relative(base, join(folder, entry.name)).split("\\").join("/")],
      )
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort()
  );
}
