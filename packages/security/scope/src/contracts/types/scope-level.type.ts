/**
 * Stackra file contract:
 * Purpose: `ScopeLevel`, one level of the scope tree as a deployment declares it in `ScopeConfig.levels`: its key and
 *          whether a node of the level may sit under a node of the same level.
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
 * ];
 */
export interface ScopeLevel {
  /** The level's key, snake_case (`product`); stored on every node of the level. */
  readonly key: string;

  /** Whether a node of this level may have children of the same level, so the level nests to any depth. */
  readonly recursive: boolean;
}
