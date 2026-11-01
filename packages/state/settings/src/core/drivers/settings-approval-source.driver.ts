/**
 * Stackra file contract:
 * Purpose: `SettingsApprovalSourceDriver`, the `ApprovalSettingsSource` of a service that has settings: it answers the
 *          effective value of one setting key (`<module>.<name>`, or `<module>.<section>.<name>`) for the running call's
 *          scope, which an approval condition reads its threshold from.
 * Boundary: reads through `SettingsResolver#resolve`, so floors, locks and entitlements apply exactly as for any read, and
 *           with no scope in the target the store reads for the running scope session's node. It refuses a key no module
 *           registered, and a key not marked `approval`: a threshold that gates a second approver must itself need one
 *           (S9, which gen also checks at build). It names no `@stackra/actions` type: the port lives in
 *           `@stackra/contracts`, which both packages depend on.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (a condition's threshold is data, S9, N2); ADR 0213 (decision 2: the cascade); ADR 0359
 *                     (decisions 3 to 5); STA-1724 FR-002.
 */
import { Driver } from "@stackra/container";
import { ApprovalSettingsSource } from "@stackra/contracts";

import { SETTING_KEY_REGISTRY } from "#core/constants/setting-key-registry.constant";
import { SettingScope } from "#core/enums/setting-scope.enum";
import { settingsPage } from "#core/functions/settings-page.function";
import type { SettingsResolver } from "#core/services/settings-resolver.service";

/**
 * Reads the settings an approval condition declared.
 *
 * @example
 * container.bind(ApprovalSettingsSource, SettingsApprovalSourceDriver);
 * await source.get("billing.maxCouponPercent"); // 20
 */
export class SettingsApprovalSourceDriver extends Driver(ApprovalSettingsSource) {
  /** The settings resolver over the stores. */
  private readonly resolver: SettingsResolver;

  /**
   * @param resolver - the settings resolver.
   */
  constructor(resolver: SettingsResolver) {
    super();
    this.resolver = resolver;
  }

  /**
   * The effective value of `key` for the running scope.
   *
   * @throws RangeError when no module registered `key`, or it is not marked `approval`.
   */
  async get(key: string): Promise<unknown> {
    for (const keys of SETTING_KEY_REGISTRY.values())
      for (const setting of keys)
        if (setting.path === key) {
          if (setting.approval !== true)
            throw new RangeError(
              `The setting ${key} is not marked approval, so an approval condition may not read it`,
            );
          // the page's level is not read by `resolve`; the module's keys are all that is needed
          const page = settingsPage(setting.module, { scope: SettingScope.Product });
          const resolved = await this.resolver.resolve(page, {});
          return resolved[setting.name]?.value;
        }
    throw new RangeError(`No module registered the setting ${key}`);
  }
}
