/**
 * Stackra file contract:
 * Purpose: `specIsOwn(folder, branch, prefixes)`, whether a spec folder is the PR's own, keyed by the branch's issue key.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import { specKeyPattern } from "./spec-key-pattern.function.ts";

/**
 * True when the branch names the folder's issue key (`figentra/sta-163-x` owns `sta-163-sdd-gates`).
 *
 * @param folder - the spec folder name.
 * @param branch - the branch name.
 * @param prefixes - the prefixes the repository uses.
 * @example
 * specIsOwn("os-12-billing", "feature/os-12-x", ["os"]); // true
 */
export function specIsOwn(folder: string, branch: string, prefixes: readonly string[]): boolean {
  const m = new RegExp(`(?:^|[/-])(${specKeyPattern(prefixes)})-(\\d+)(?:-|$)`, "i").exec(branch);
  return m !== null && folder.startsWith(`${(m[1] ?? "").toLowerCase()}-${m[2] ?? ""}-`);
}
