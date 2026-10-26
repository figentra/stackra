/**
 * Stackra file contract:
 * Purpose: the `SettingEntitlementSource` port: which of the entitlements a settings group names (`@Setting({
 *          entitlement })`, `@Setting({ entitlementValues })`) the holder at a target is granted. The memory driver
 *          serves tests; a deployment binds a driver over the entitlements package's `EntitlementSource` (the plan
 *          snapshot in SaaS, the licence on-prem).
 * Boundary: an abstract class that is its own token, keyed `settings.SettingEntitlementSource`. It answers grants by
 *           entitlement key (`access.enterprise_support`) and nothing else; `SettingsReader` and `SettingsResolver`
 *           read a gated key as its default and refuse a gated write. Settings depends on no entitlements package:
 *           the key is text, as a floor's pack key is (ADR 0420 decision 2). A limit grant counts as granted when the
 *           driver says so.
 * Runtime: isomorphic
 * Governing contract: ADR 0420 (decisions 1 and 2); ADR 0215 (decision 1: grants come from one source); ADR 0213.
 */
import { Port } from "@stackra/contracts";

import type { SettingTarget } from "#contracts/types/setting-target.type";

/**
 * Answers the granted entitlements of a holder.
 *
 * @example
 * export class PlanSettingEntitlementSourceDriver extends Driver(SettingEntitlementSource) {
 *   async granted(entitlements: readonly string[], target: SettingTarget): Promise<ReadonlySet<string>> { ... }
 * }
 */
export abstract class SettingEntitlementSource extends Port {
  /** Type-only port key, so `DriverName<SettingEntitlementSource>` narrows to this port's drivers. */
  declare readonly "~key": "settings.SettingEntitlementSource";

  /**
   * The keys of `entitlements` the holder at `target` is granted; a key not answered is not granted.
   *
   * @throws Error when the grants cannot be read; the read or write then fails, never as granted.
   */
  abstract granted(
    entitlements: readonly string[],
    target: SettingTarget,
  ): Promise<ReadonlySet<string>>;
}
