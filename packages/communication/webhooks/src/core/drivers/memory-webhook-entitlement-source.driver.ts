/**
 * Stackra file contract:
 * Purpose: `MemoryWebhookEntitlementSourceDriver`, a `WebhookEntitlementSource` held in memory: for tests and local
 *          runs. It grants nothing until a test grants an entitlement to a scope node.
 * Boundary: grants per scope node id; it knows no plan, so a test grants what the plan it plays includes. A deployment
 *           binds a driver over its plan or licence instead.
 * Runtime: isomorphic
 * Governing contract: ADR 0422 (decision 4); ADR 0142 (drivers behind a port); ADR 0266 (memory drivers first).
 */
import { Driver } from "@stackra/container";

import { WebhookEntitlementSource } from "#contracts/index";

/**
 * Grants in memory, per scope node.
 *
 * @example
 * const entitlements = new MemoryWebhookEntitlementSourceDriver().grant("scp_…", "records.audit_evidence");
 */
export class MemoryWebhookEntitlementSourceDriver extends Driver(WebhookEntitlementSource) {
  /** Scope node id to its granted keys. */
  private readonly grants = new Map<string, Set<string>>();

  /**
   * Grants `entitlements` to scope node `scopeId`.
   *
   * @returns this source, to chain.
   */
  grant(scopeId: string, ...entitlements: readonly string[]): this {
    const keys = this.grants.get(scopeId) ?? new Set<string>();
    for (const entitlement of entitlements) keys.add(entitlement);
    this.grants.set(scopeId, keys);
    return this;
  }

  /**
   * Takes `entitlements` back from scope node `scopeId`.
   *
   * @returns this source, to chain.
   */
  revoke(scopeId: string, ...entitlements: readonly string[]): this {
    for (const entitlement of entitlements) this.grants.get(scopeId)?.delete(entitlement);
    return this;
  }

  /** Implements `WebhookEntitlementSource.granted`, documented there. */
  async granted(entitlements: readonly string[], scopeId: string): Promise<ReadonlySet<string>> {
    const keys = this.grants.get(scopeId);
    return new Set(entitlements.filter((entitlement) => keys?.has(entitlement) === true));
  }
}
