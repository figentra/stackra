/**
 * Stackra file contract:
 * Purpose: `specRoutes(yaml)`, the task types under `tasks:` in `.agents/routing.yaml`.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */

/**
 * The task type names.
 *
 * @param yaml - the routing.yaml text.
 * @example
 * specRoutes("tasks:\n  tests:\n    x: 1\n"); // Set { "tests" }
 */
export function specRoutes(yaml: string): Set<string> {
  const block = /^tasks:\s*\n([\s\S]*?)(?=^\S|(?![\s\S]))/m.exec(yaml)?.[1] ?? "";
  return new Set([...block.matchAll(/^ {2}([a-z][a-z0-9-]*):/gm)].map((m) => m[1] ?? ""));
}
