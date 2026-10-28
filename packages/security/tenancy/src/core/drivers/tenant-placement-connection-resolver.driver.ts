/**
 * Stackra file contract:
 * Purpose: `TenantPlacementConnectionResolverDriver`, the `ConnectionResolver` (`@stackra/database/contracts`) over
 *          the placement map: a scope's work runs on its tenant's cell; platform work and a scope above every tenant
 *          run on `PRIMARY_CONNECTION`.
 * Boundary: answers a name only; opening one connection set per cell is the routing `Database` driver (stackra-322).
 *           A tenant with no placement throws (a registry bug), never falls back to the primary, so a placed tenant's
 *           rows are never written to the wrong cell.
 * Runtime: isomorphic
 * Governing contract: ADR 0088 (decision 3: the connection resolver contract); ADR 0186 (decision 6: cells, "data plus
 *                     a picker"); stackra-310 (gap db15).
 */
import { Driver } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";
import { ConnectionResolver, PRIMARY_CONNECTION } from "@stackra/database/contracts";
import type { ScopeTree } from "@stackra/scope/contracts";

import { tenantOf } from "#core/functions/tenant-of.function";
import type { TenantPlacement } from "#core/ports/tenant-placement.port";

/**
 * Names a scope's cell from its tenant's placement.
 *
 * @example
 * await resolver.connectionOf(scope); // "primary", or the tenant's cell once cells exist
 */
export class TenantPlacementConnectionResolverDriver extends Driver(ConnectionResolver) {
  /** The placement map. */
  private readonly placements: TenantPlacement;

  /** Where a scope's tenant is found. */
  private readonly tree: ScopeTree;

  /**
   * @param placements - the tenant registry's placement map.
   * @param tree - the scope tree.
   */
  constructor(placements: TenantPlacement, tree: ScopeTree) {
    super();
    this.placements = placements;
    this.tree = tree;
  }

  /**
   * Implements `ConnectionResolver.connectionOf`, documented there.
   *
   * @throws Error when the scope's tenant has no placement.
   */
  async connectionOf(scope: ScopeRef | undefined): Promise<string> {
    if (scope === undefined) return PRIMARY_CONNECTION;
    const tenant = await tenantOf(this.tree, scope);
    if (tenant === undefined) return PRIMARY_CONNECTION;
    const placement = await this.placements.of(tenant);
    if (placement === undefined) throw new Error(`Tenant ${tenant} has no placement`);
    return placement.cell;
  }
}
