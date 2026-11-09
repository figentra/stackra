/**
 * Stackra file contract:
 * Purpose: `childLevelsOf(levels, parent)`, the level keys a new node may take under a parent at level `parent`, in
 *          declared order: the parent's own level when it is recursive; every level whose `parents` name it; and the
 *          next declared level when that level names no `parents`. The first level alone for the root.
 * Boundary: pure; reads the declared levels only, so a level added to `ScopeConfig.levels` is offered with no code
 *           change. A level with no `parents` keeps the chain rule, so a configuration without them behaves as before.
 *           A parent whose level is no longer declared takes no children (an empty list). `ScopeConfig$` refuses an
 *           undeclared parent, so none is looked up here.
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
 * const units = [{ key: "tenant", recursive: true }, { key: "unit", recursive: true, parents: ["tenant"] },
 *   { key: "location", recursive: false, parents: ["tenant", "unit"] }];
 * childLevelsOf(units, "tenant"); // ["tenant", "unit", "location"]
 */
export function childLevelsOf(levels: readonly ScopeLevel[], parent?: string): string[] {
  if (parent === undefined) return levels.slice(0, 1).map((level) => level.key);
  const index = levels.findIndex((level) => level.key === parent);
  if (index === -1) return [];
  return levels
    .filter((level, at) =>
      at === index
        ? level.recursive
        : level.parents === undefined
          ? at === index + 1
          : level.parents.includes(parent),
    )
    .map((level) => level.key);
}
