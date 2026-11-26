/**
 * Stackra file contract:
 * Purpose: `MemoryIdpOrganizationsDriver`, an `IdpOrganizations` over a scope-to-organisation map held in memory, for
 *          tests and local runs.
 * Boundary: process-local; never a production source (the identity service keeps the mapping it wrote when it
 *           created each tenant's organisation). Matches the scope node's id exactly; holds nothing until `link`, so the
 *           container builds it with no arguments.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (a driver is named by its class: `memory`); ADR 0410 (decision 4); STA-2817.
 */
import { Driver } from "@stackra/container";
import type { PublicId, ScopeRef } from "@stackra/contracts";

import { IdpOrganizations } from "#contracts/index";

/**
 * Scope-to-organisation links held in memory.
 *
 * @example
 * const organizations = new MemoryIdpOrganizationsDriver().link("scp_acme", "org_1");
 */
export class MemoryIdpOrganizationsDriver extends Driver(IdpOrganizations) {
  /** Scope node id to the provider's organisation id. */
  readonly links = new Map<PublicId, string>();

  /**
   * Makes `scopeId`'s people sign in through `organizationId`, replacing any link before.
   *
   * @returns this source, to chain.
   */
  link(scopeId: PublicId, organizationId: string): this {
    this.links.set(scopeId, organizationId);
    return this;
  }

  /** See `IdpOrganizations.organizationOf`; a scope never linked has none. */
  organizationOf(scope: ScopeRef): Promise<string | undefined> {
    return Promise.resolve(this.links.get(scope.id));
  }
}
