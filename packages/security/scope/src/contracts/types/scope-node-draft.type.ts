/**
 * Stackra file contract:
 * Purpose: `ScopeNodeDraft`, what adding a node to the tree takes: the parent (none for the root), the level, the
 *          path label and the display name.
 * Boundary: a type only. The node's path is the parent's path and the label; its public id is minted when it is
 *           stored. Which levels may sit under the parent is `childLevelsOf(ScopeConfig.levels, parent.level)`.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decisions 2 and 3).
 */
import type { ScopeRef } from "@stackra/contracts";

/**
 * A node to add.
 *
 * @example
 * const draft: ScopeNodeDraft = { parent: root, level: "product", label: "acme", name: "Acme" };
 */
export interface ScopeNodeDraft {
  /** The node to add under; absent for the root. */
  readonly parent?: ScopeRef;

  /** The level's key. */
  readonly level: string;

  /** The last label of the node's path: 1 to 63 of `a-z`, `0-9` and `_`. */
  readonly label: string;

  /** The node's display name. */
  readonly name: string;
}
