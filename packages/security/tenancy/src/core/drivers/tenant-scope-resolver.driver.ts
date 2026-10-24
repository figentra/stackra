/**
 * Stackra file contract:
 * Purpose: `TenantScopeResolverDriver`, the tenancy step of the scope resolver chain: the scope node of the tenant the
 *          verified caller acts in (`actor.tenantId`), asked after the header and the claim and before the root.
 * Boundary: a `ScopeResolver` driver. The tenant id comes from the verified credential, never from input, so it is not
 *           checked against grants; an id that is not a tenant id, a node the tree does not show, or a node at another
 *           level passes the request on (`undefined`). A host places it in the chain with its override of
 *           `ChainScopeResolverDriver.steps()`. It picks a scope only: the call's row isolation is
 *           `TenantIsolationService.withTenant` (`./node`).
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decisions 7 and 8); ADR 0142 (drivers behind a port); ADR 0098 (the verified caller).
 */
import { Driver } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";
import { ScopeResolver, ScopeTree } from "@stackra/scope/contracts";
import type { ScopeRequest } from "@stackra/scope/contracts";

import { TenancyScopes } from "#core/enums/tenancy-scopes.enum";
import { isTenantId } from "#core/functions/is-tenant-id.function";

/**
 * The tenancy step.
 *
 * @example
 * // src/overrides/@stackra/scope/core/drivers/chain-scope-resolver.driver.ts of a host
 * export class ChainScopeResolverDriver extends BaseChainScopeResolverDriver {
 *   private readonly tenant: TenantScopeResolverDriver;
 *   constructor(header: HeaderScopeResolverDriver, claim: ClaimScopeResolverDriver, root: RootScopeResolverDriver,
 *     tenant: TenantScopeResolverDriver) {
 *     super(header, claim, root);
 *     this.tenant = tenant;
 *   }
 *   protected override steps(): readonly ScopeResolver[] {
 *     const steps = super.steps();
 *     return [...steps.slice(0, -1), this.tenant, ...steps.slice(-1)]; // header, claim, tenancy, root
 *   }
 * }
 */
export class TenantScopeResolverDriver extends Driver(ScopeResolver) {
  /** Where the tenant's node is looked up. */
  private readonly tree: ScopeTree;

  /** @param tree - the scope tree. */
  constructor(tree: ScopeTree) {
    super();
    this.tree = tree;
  }

  /** The caller's tenant node, or `undefined` when the caller acts in no tenant the tree shows. */
  async resolve(request: ScopeRequest): Promise<ScopeRef | undefined> {
    const { tenantId } = request.actor;
    if (tenantId === undefined || !isTenantId(tenantId)) return undefined;
    const node = await this.tree.node(tenantId);
    return node?.level === TenancyScopes.Tenant ? node : undefined;
  }
}
