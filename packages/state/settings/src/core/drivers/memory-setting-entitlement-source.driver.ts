/**
 * Stackra file contract:
 * Purpose: `MemorySettingEntitlementSourceDriver`, a `SettingEntitlementSource` held in memory: for tests and local
 *          runs. It grants nothing until a test grants an entitlement.
 * Boundary: holds one set of granted keys for every target; it knows no plan, so a test grants what the plan it plays
 *           includes. Answers are copies.
 * Runtime: isomorphic
 * Governing contract: ADR 0420 (decision 2); ADR 0142 (drivers behind a port); ADR 0266 (memory drivers first).
 */
import { Driver } from "@stackra/container";

import { SettingEntitlementSource } from "#contracts/index";

/**
 * Grants in memory.
 *
 * @example
 * const entitlements = new MemorySettingEntitlementSourceDriver().grant("access.enterprise_support");
 */
export class MemorySettingEntitlementSourceDriver extends Driver(SettingEntitlementSource) {
  /** The granted keys. */
  private readonly keys = new Set<string>();

  /**
   * Grants `entitlements` to every target.
   *
   * @returns this source, to chain.
   */
  grant(...entitlements: readonly string[]): this {
    for (const entitlement of entitlements) this.keys.add(entitlement);
    return this;
  }

  /**
   * Takes `entitlements` back.
   *
   * @returns this source, to chain.
   */
  revoke(...entitlements: readonly string[]): this {
    for (const entitlement of entitlements) this.keys.delete(entitlement);
    return this;
  }

  /** See `SettingEntitlementSource.granted`. */
  async granted(entitlements: readonly string[]): Promise<ReadonlySet<string>> {
    return new Set(entitlements.filter((entitlement) => this.keys.has(entitlement)));
  }
}
