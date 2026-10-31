/**
 * Stackra file contract:
 * Purpose: `TenantScopeOwnershipDriver`, the `ScopeOwnership` of a service: an actor holds a scope when it acts in no
 *          tenant (a platform actor), or when its `scopeId` is the tenant that owns the scope (`tenantOf`).
 * Boundary: reads the scope tree only. A scope above every tenant, or none, is held by no tenant actor, so a stored
 *           message whose actor names a tenant its scope does not belong to is never trusted (ADR 0495 decision 2).
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decision 2); ADR 0327 (decision 8: a tenant is the scope node at the tenant level).
 */
import { ScopeOwnership } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import type { Actor, ScopeRef } from "@stackra/contracts";
import type { ScopeTree } from "@stackra/scope/contracts";

import { tenantOf } from "#core/functions/tenant-of.function";

/**
 * Whether an actor's tenant owns a scope.
 *
 * @example
 * await new TenantScopeOwnershipDriver(tree).holds(actor, { id: branchId, path: "platform.acme.riyadh" });
 */
export class TenantScopeOwnershipDriver extends Driver(ScopeOwnership) {
  /** Where a scope's tenant is found. */
  private readonly tree: ScopeTree;

  /**
   * @param tree - the scope tree.
   */
  constructor(tree: ScopeTree) {
    super();
    this.tree = tree;
  }

  /** Implements `ScopeOwnership.holds`, documented there. */
  async holds(actor: Actor, scope: ScopeRef | undefined): Promise<boolean> {
    if (actor.scopeId === undefined) return true;
    return scope !== undefined && (await tenantOf(this.tree, scope)) === actor.scopeId;
  }
}
