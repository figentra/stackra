/**
 * Stackra file contract:
 * Purpose: `specRefsKeys(commits, prefixes)`, the issue keys named on the `Refs:` trailers of commit messages.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import { specKeyPattern } from "./spec-key-pattern.function.ts";

/**
 * The upper-case keys (`OS-12`) of the `Refs:` trailers; a key anywhere else in a message does not count.
 *
 * @param commits - commit messages.
 * @param prefixes - the prefixes the repository uses.
 * @example
 * specRefsKeys(["feat: a\n\nRefs: OS-1, os-2"], ["os"]); // Set { "OS-1", "OS-2" }
 */
export function specRefsKeys(commits: readonly string[], prefixes: readonly string[]): Set<string> {
  const re = new RegExp(`\\b(${specKeyPattern(prefixes)})-(\\d+)\\b`, "gi");
  return new Set(
    commits.flatMap((c) =>
      [...c.matchAll(/^Refs:[ \t]*(.*)$/gim)].flatMap((r) =>
        [...(r[1] ?? "").matchAll(re)].map((m) => `${(m[1] ?? "").toUpperCase()}-${m[2] ?? ""}`),
      ),
    ),
  );
}
