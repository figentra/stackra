/**
 * Stackra file contract:
 * Purpose: `specMemberOf(path)`, the workspace member a repository path belongs to, for the drift rule.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */

/**
 * The member path prefix (`packages/<category>/<name>`, `apps/<n>`, `services/<n>`), or `undefined`.
 *
 * @param path - repository-relative.
 * @example
 * specMemberOf("packages/data/storage/src/a.ts"); // "packages/data/storage"
 */
export function specMemberOf(path: string): string | undefined {
  return (
    /^packages\/[^/]+\/[^/]+(?=\/)/.exec(path)?.[0] ??
    /^(?:apps|services)\/[^/]+(?=\/)/.exec(path)?.[0]
  );
}
