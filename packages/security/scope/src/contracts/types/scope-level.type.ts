/**
 * Stackra file contract:
 * Purpose: `ScopeLevel`, one level of the scope tree as a deployment declares it in `ScopeConfig.levels`: its key,
 *          whether a node of the level may sit under a node of the same level, and, optionally, the levels it may sit
 *          under (`parents`), for a tree where one level sits under several (a location under a tenant or a unit).
 * Boundary: a type only. Levels are data (ADR 0327 d2): adding one is a change to `ScopeConfig`, never to code or to a
 *           migration, because a node stores its level's key as text. The display name of a level is its alias, a
 *           lang key in `ScopeConfig.aliases`, not a field here.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decisions 2 and 4); ADR 0208 (decision 1: levels a product declares).
 */

/**
 * One level, in the order the tree nests them.
 *
 * @example
 * const levels: ScopeLevel[] = [
 *   { key: "platform", recursive: false },
 *   { key: "product", recursive: false },
 *   { key: "location", recursive: false, parents: ["product"] },
 * ];
 */
export interface ScopeLevel {
  /** The level's key, snake_case (`product`); stored on every node of the level. */
  readonly key: string;

  /** Whether a node of this level may have children of the same level, so the level nests to any depth. */
  readonly recursive: boolean;

  /**
   * The levels a node of this level may sit under, by key. Absent: under the level declared before it (and under its
   * own level when recursive), as before. Each must be a declared level, and the level itself only when recursive.
   */
  readonly parents?: readonly string[] | undefined;
}
