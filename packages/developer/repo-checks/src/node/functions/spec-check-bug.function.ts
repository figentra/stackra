/**
 * Stackra file contract:
 * Purpose: `specCheckBug(folder, tests, prefixes)`, the bug lane: `.specify/bugs/<prefix>-<n>-<slug>/` needs a regression
 *          test tagged `@covers <prefix>-<n>:BUG`.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import { specFolderOf } from "./spec-folder-of.function.ts";
import { specFolderShape } from "./spec-folder-shape.function.ts";

/**
 * Problems of one bug folder.
 *
 * @param folder - the bug folder name.
 * @param tests - the concatenated text of the repository's test files.
 * @param prefixes - the prefixes the repository uses.
 * @example
 * specCheckBug("os-44-crash", "/** @covers os-44:BUG *\/", ["os"]); // []
 */
export function specCheckBug(folder: string, tests: string, prefixes: readonly string[]): string[] {
  const parsed = specFolderOf(folder);
  if (!parsed || (prefixes.length > 0 && !prefixes.includes(parsed.prefix)))
    return [`.specify/bugs/${folder}: folder is not \`${specFolderShape(prefixes)}\``];
  const tag = `${parsed.prefix}-${parsed.number}`;
  return new RegExp(`@covers[^\\n]*\\b${tag}:BUG\\b`, "i").test(tests)
    ? []
    : [`.specify/bugs/${folder}: no regression test carries \`@covers ${tag}:BUG\``];
}
