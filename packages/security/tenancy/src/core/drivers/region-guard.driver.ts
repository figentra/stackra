/**
 * Stackra file contract:
 * Purpose: `RegionGuardDriver`, a `TenancyCheck` (the first step of the action pipeline, for every request and job):
 *          it refuses a call whose tenant is placed in another region than this deployment's
 *          (`DatabaseConfig.region`), so a misrouted call fails loudly instead of reading or writing out of region.
 * Boundary: the tenant comes from the call's scope through the tree (`tenantOf`); a call with no scope or a scope
 *           above every tenant passes. It fails closed: a tenant with no placement, or a deployment with no region
 *           key, throws an `Error` (a registry or runway bug), never passes. It is the one `TenancyCheck` binding; a
 *           host with its own tenant-state check calls this driver's `check` from its own.
 * Runtime: isomorphic
 * Governing contract: ADR 0353 (decisions 1 and 2); ADR 0172 (decision 3); ADR 0138 (as amended: tenancy is the first
 *                     step); stackra-310 (gap gov18).
 */
import { type CallDescriptor, TenancyCheck } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import type { DatabaseConfig } from "@stackra/database";
import type { ScopeTree } from "@stackra/scope/contracts";

import { RegionMismatchError } from "#core/errors/region-mismatch.error";
import { tenantOf } from "#core/functions/tenant-of.function";
import type { TenantPlacement } from "#core/ports/tenant-placement.port";

/**
 * Refuses an out-of-region call.
 *
 * @example
 * const guard = new RegionGuardDriver(placements, tree, databaseConfig);
 * await guard.check(call); // throws RegionMismatchError for an `eu` tenant on the `me` deployment
 */
export class RegionGuardDriver extends Driver(TenancyCheck) {
  /** The placement map. */
  private readonly placements: TenantPlacement;

  /** Where a scope's tenant is found. */
  private readonly tree: ScopeTree;

  /** This deployment's region key. */
  private readonly config: DatabaseConfig;

  /**
   * @param placements - the tenant registry's placement map.
   * @param tree - the scope tree.
   * @param config - the database configuration, whose `region` runway sets per stack.
   */
  constructor(placements: TenantPlacement, tree: ScopeTree, config: DatabaseConfig) {
    super();
    this.placements = placements;
    this.tree = tree;
    this.config = config;
  }

  /**
   * Resolves when the call's tenant lives in this deployment's region, or the call has no tenant.
   *
   * @throws RegionMismatchError when the tenant is placed in another region.
   * @throws Error when the tenant has no placement or the deployment names no region.
   */
  async check(call: CallDescriptor): Promise<void> {
    if (call.scope === undefined) return;
    const tenant = await tenantOf(this.tree, call.scope);
    if (tenant === undefined) return;
    const placement = await this.placements.of(tenant);
    if (placement === undefined) throw new Error(`Tenant ${tenant} has no placement`);
    if (this.config.region === "")
      throw new Error("DatabaseConfig.region is not set, so the region guard cannot check");
    if (placement.region !== this.config.region)
      throw RegionMismatchError.create({ region: placement.region });
  }
}
