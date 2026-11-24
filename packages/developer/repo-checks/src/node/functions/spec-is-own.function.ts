/**
 * Stackra file contract:
 * Purpose: `specIsOwn(folder, branch, prefixes, title)`, whether a spec folder is the PR's own, keyed by the branch's issue key,
 *          or, for an agent lane branch (`stackra/l<n>/<slug>`, which carries no key), by an issue key in the PR title.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import { specKeyPattern } from "./spec-key-pattern.function.ts";

/** An agent lane branch, `stackra/l<n>/<slug>`: named by lane and topic, so it carries no issue key. */
const LANE_BRANCH = /^stackra\/l\d+\//;

/**
 * True when the branch names the folder's issue key (`figentra/sta-163-x` owns `sta-163-sdd-gates`). A lane branch has
 * no key of its own, so its PR title's key names the spec instead (`stackra/l6/x` titled `fix: y (OS-163)`); any other
 * branch ignores the title.
 *
 * @param folder - the spec folder name.
 * @param branch - the branch name.
 * @param prefixes - the prefixes the repository uses.
 * @param title - the PR title; only a lane branch reads it.
 * @example
 * specIsOwn("os-12-billing", "feature/os-12-x", ["os"]); // true
 * specIsOwn("os-12-billing", "stackra/l6/x", ["os"], "fix: x (OS-12)"); // true
 */
export function specIsOwn(
  folder: string,
  branch: string,
  prefixes: readonly string[],
  title = "",
): boolean {
  const key = specKeyPattern(prefixes);
  const m = new RegExp(`(?:^|[/-])(${key})-(\\d+)(?:-|$)`, "i").exec(branch);
  if (m !== null && folder.startsWith(`${(m[1] ?? "").toLowerCase()}-${m[2] ?? ""}-`)) return true;
  if (!LANE_BRANCH.test(branch)) return false;
  for (const named of title.matchAll(new RegExp(`\\b(${key})-(\\d+)\\b`, "gi")))
    if (folder.startsWith(`${(named[1] ?? "").toLowerCase()}-${named[2] ?? ""}-`)) return true;
  return false;
}
