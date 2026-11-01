/**
 * Stackra file contract:
 * Purpose: `specPrefixesOf(folders)`, the issue prefixes the repository's existing spec folders use; they are the only
 *          ones the gates treat as issue keys.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import { specFolderOf } from "./spec-folder-of.function.ts";

/**
 * The distinct prefixes of the spec folders, sorted.
 *
 * @param folders - the entry names under the specs folder; names that are not spec folders add nothing.
 * @example
 * specPrefixesOf(["os-12-billing", "os-3-x", "README.md"]); // ["os"]
 */
export function specPrefixesOf(folders: readonly string[]): string[] {
  const found = folders.flatMap((f) => specFolderOf(f)?.prefix ?? []);
  // oxlint-disable-next-line unicorn/no-array-sort -- reason: toSorted is ES2023 and the base lib is ES2022; the spread copy is ours
  return [...new Set(found)].sort();
}
