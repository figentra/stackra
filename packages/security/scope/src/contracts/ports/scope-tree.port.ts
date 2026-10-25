/**
 * Stackra file contract:
 * Purpose: the `ScopeTree` port: the read side of the scope tree that settings, IAM, flags and the resolver chain
 *          read: one node by public id or by path, the ancestors of a node and its descendants.
 * Boundary: an abstract class that is its own token. Reads only; nodes are added through `ScopeNodeService`
 *           (`./node`). The Postgres driver reads in the caller's scope session (`Database.withScope`), so row-level
 *           security shows only the nodes at or below the caller's granted paths; the memory driver holds what it was
 *           given. Nothing here filters rows in application code (ADR 0327 d9).
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decisions 1, 3 and 9); ADR 0240 (decision 5); ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";
import type { PublicId, ScopeRef } from "@stackra/contracts";

import type { ScopeEntry } from "#contracts/types/scope-entry.type";

/**
 * Reads the tree.
 *
 * @example
 * const chain = [...(await tree.ancestors(scope)), await tree.node(scope.id)];
 */
export abstract class ScopeTree extends Port {
  /** The node with public id `id`, or `undefined` when none is visible. */
  abstract node(id: PublicId<"scp">): Promise<ScopeEntry | undefined>;

  /** The node at `path`, or `undefined` when none is visible. */
  abstract byPath(path: string): Promise<ScopeEntry | undefined>;

  /** The nodes above `scope`, root first; the node itself is not one of them. */
  abstract ancestors(scope: ScopeRef): Promise<readonly ScopeEntry[]>;

  /** The nodes below `scope` at any depth, in path order; the node itself is not one of them. */
  abstract descendants(scope: ScopeRef): Promise<readonly ScopeEntry[]>;
}
