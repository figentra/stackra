/**
 * Stackra file contract:
 * Purpose: `LoyaltyTierSettings`, the tiers section of `LoyaltyKitSettings`: the balances at which an account is
 *          promoted.
 * Boundary: a shape class; as the type of a settings field it becomes a section (one card on the settings page, keys
 *           `loyalty_kit.tiers.<field>`, labels `loyalty_kit::settings.tiers.<field>.label`). Its initializers are the
 *           section's defaults. Sections are one level deep. It registers its schema when the module loads (STA-339
 *           replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4 and 26); ADR 0307 (rules 22 to 24); ADR 0213.
 */
import { Setting } from "@stackra/settings";
import { Int, registerSchemas, Schema } from "@stackra/validation";

import { LOYALTY_TIER_SETTINGS_SCHEMA } from "#node/constants/loyalty-tier-settings-schema.constant";

/**
 * Promotion thresholds in whole points; demotion is never automatic.
 *
 * @example
 * const { tiers } = await settings.get(LoyaltyKitSettings);
 * tiers.goldFrom; // 5000
 */
export class LoyaltyTierSettings extends Schema {
  /** Balance at which an account becomes silver. */
  @Int({ min: 0 })
  silverFrom = 1000;

  /** Balance at which an account becomes gold; the platform may lock it for every scope below. */
  @Int({ min: 0 })
  @Setting({ lockable: true })
  goldFrom = 5000;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[LoyaltyTierSettings, LOYALTY_TIER_SETTINGS_SCHEMA]]);
