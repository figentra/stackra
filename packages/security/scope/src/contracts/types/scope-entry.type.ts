/**
 * Stackra file contract:
 * Purpose: `ScopeEntry`, one node of the scope tree as the `ScopeTree` port reads it: the `ScopeRef` (public id and
 *          path) with the node's level key and display name.
 * Boundary: a type only. It extends the contracts `ScopeRef`, so an entry is accepted wherever a ref is
 *           (`Database.withScope(entry, ...)`); a consumer that needs only the ref never reads the rest.
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decisions 2, 3 and 5).
 */
import type { ScopeRef } from "@stackra/contracts";

/**
 * A node of the tree.
 *
 * @example
 * const entry: ScopeEntry = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3", path: "platform.acme", level: "product", name: "Acme" };
 */
export interface ScopeEntry extends ScopeRef {
  /** The key of the level the node sits at, one of `ScopeConfig.levels`. */
  readonly level: string;

  /** The node's display name. */
  readonly name: string;
}
