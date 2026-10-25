/**
 * Stackra file contract:
 * Purpose: `childLevelsOf(levels, parent)`, the level keys a new node may take under a parent at level `parent`: the
 *          parent's own level when it is recursive, then the next declared level; the first level alone for the root.
 * Boundary: pure; reads the declared levels only, so a level added to `ScopeConfig.levels` is offered with no code
 *           change. A parent whose level is no longer declared takes no children (an empty list).
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decision 2: levels are data, the recursive level nests); ADR 0208 (decision 1).
 */
import type { ScopeLevel } from "#contracts/index";

/**
 * The levels a child of a `parent`-level node may take; `parent` undefined asks for the root's.
 *
 * @example
 * const levels = [{ key: "platform", recursive: false }, { key: "product", recursive: true }];
 * childLevelsOf(levels); // ["platform"]
 * childLevelsOf(levels, "product"); // ["product"]
 */
export function childLevelsOf(levels: readonly ScopeLevel[], parent?: string): string[] {
  if (parent === undefined) return levels.slice(0, 1).map((level) => level.key);
  const index = levels.findIndex((level) => level.key === parent);
  if (index === -1) return [];
  const own = levels[index];
  const next = levels[index + 1];
  const keys: string[] = [];
  if (own?.recursive === true) keys.push(own.key);
  if (next !== undefined) keys.push(next.key);
  return keys;
}
