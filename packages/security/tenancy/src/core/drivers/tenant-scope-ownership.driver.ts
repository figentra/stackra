/**
 * Stackra file contract:
 * Purpose: `TenantScopeOwnershipDriver`, the `ScopeOwnership` of a service: an actor holds a scope when it acts in no
 *          tenant (a platform actor), or when its `scopeId` is the tenant that owns the scope (`tenantOf`).
 * Boundary: reads the scope tree only, in a scope session over the root label of the scope's path
 *           (`readTreeAtRoot`), as the isolation driver does: the inbox and the approval executor ask outside every
 *           scope session and an automation's release inside its caller's, and the tree's row security shows the first
 *           no node and the second only its own subtree, which would deny every tenant actor (STA-1717). A scope above
 *           every tenant, or none, is held by no tenant actor, so a stored message whose actor names a tenant its scope
 *           does not belong to is never trusted (ADR 0495 decision 2).
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decision 2); ADR 0327 (decision 8: a tenant is the scope node at the tenant level).
 */
import { ScopeOwnership } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import type { Actor, ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import type { ScopeTree } from "@stackra/scope/contracts";

import { readTreeAtRoot } from "#core/functions/read-tree-at-root.function";
import { tenantOf } from "#core/functions/tenant-of.function";

/**
 * Whether an actor's tenant owns a scope.
 *
 * @example
 * await new TenantScopeOwnershipDriver(tree, database).holds(actor, { id: branchId, path: "platform.acme.riyadh" });
 */
export class TenantScopeOwnershipDriver extends Driver(ScopeOwnership) {
  /** Where a scope's tenant is found. */
  private readonly tree: ScopeTree;

  /** Opens the scope session the tree is read in. */
  private readonly database: Database;

  /**
   * @param tree - the scope tree.
   * @param database - the connected database the tree is read on.
   */
  constructor(tree: ScopeTree, database: Database) {
    super();
    this.tree = tree;
    this.database = database;
  }

  /** Implements `ScopeOwnership.holds`, documented there. */
  async holds(actor: Actor, scope: ScopeRef | undefined): Promise<boolean> {
    if (actor.scopeId === undefined) return true;
    if (scope === undefined) return false;
    const tenant = await readTreeAtRoot(this.database, scope, () => tenantOf(this.tree, scope));
    return tenant === actor.scopeId;
  }
}
