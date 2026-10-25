/**
 * Stackra file contract:
 * Purpose: `LoyaltyKitSettings`, the runtime loyalty settings an admin tunes without a deploy: the expiry window, the
 *          tier thresholds and the stamp card (stamps per visit, stamps per card), resolved through the settings
 *          cascade (platform, then the scope level tenancy contributes).
 * Boundary: the module's one settings group; its key is the package key (`loyalty_kit`) and each field is a setting
 *           named by its path (`loyalty_kit.expiryMonths`, `loyalty_kit.tiers.goldFrom`). A field typed by a schema
 *           class is a section, one level deep, whose defaults are the section class's initializers. `@Setting`
 *           narrows one field: `lockable` lets the platform pin the value for every scope below, `approval` makes a
 *           change wait for a second holder of `loyalty_kit.settings.approve`. `rules(r)` is the cross-field check.
 *           Code reads the resolved group with `SettingsReader#get(LoyaltyKitSettings)`. The scope level is tenancy's
 *           `TenancyScopes.Tenant` (ADR 0323 d4). Never a secret; deploy-time values (the ledger driver, the earn rate)
 *           are config. It registers its schema when the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 13, 16 and 20); ADR 0307 (rules 22 to 24); ADR 0213; ADR 0323 (decision 4).
 */
import { Setting, SettingScope, Settings, type SettingsRules } from "@stackra/settings";
import { TenancyScopes } from "@stackra/tenancy";
import { Int, registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { LOYALTY_TIER_SETTINGS_SCHEMA } from "#node/constants/loyalty-tier-settings-schema.constant";
import type { LoyaltyTierSettings } from "#node/schemas/loyalty-tier-settings.schema";

/**
 * The platform scope holds the defaults below; a scope below overrides what is not locked.
 *
 * @example
 * const { expiryMonths, tiers } = await this.settings.get(LoyaltyKitSettings);
 */
export class LoyaltyKitSettings extends Settings({
  scopes: [SettingScope.Platform, TenancyScopes.Tenant],
}) {
  /** Months after which unspent earned points expire; bounded, so a typo cannot expire all. */
  @Int({ min: 1, max: 60 })
  @Setting({ lockable: true })
  expiryMonths = 12;

  /** The tier thresholds; changing a member benefit needs a second admin's approval. */
  @Setting({ approval: true })
  tiers!: LoyaltyTierSettings;

  /** Stamps one visit earns on a stamp card (earning by visit count). */
  @Int({ min: 1, max: 100 })
  @Setting()
  stampsPerVisit = 1;

  /** Stamps one card holds; a full card is one reward. */
  @Int({ min: 1, max: 1000 })
  @Setting()
  stampsPerCard = 10;

  /** Silver must start below gold, or no account could ever be silver. */
  override rules(r: SettingsRules<LoyaltyKitSettings>) {
    return [r.lessThan("tiers.silverFrom", "tiers.goldFrom")];
  }
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration, the rule compiled in
// (STA-339).
registerSchemas([
  [
    LoyaltyKitSettings,
    z
      .object({
        expiryMonths: z.number().int().min(1).max(60).default(12),
        stampsPerVisit: z.number().int().min(1).max(100).default(1),
        stampsPerCard: z.number().int().min(1).max(1000).default(10),
        tiers: LOYALTY_TIER_SETTINGS_SCHEMA.default(() => LOYALTY_TIER_SETTINGS_SCHEMA.parse({})),
      })
      .refine((group) => group.tiers.silverFrom < group.tiers.goldFrom, {
        path: ["tiers", "silverFrom"],
      }),
  ],
]);
