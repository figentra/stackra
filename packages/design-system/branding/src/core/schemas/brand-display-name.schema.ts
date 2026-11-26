/**
 * Stackra file contract:
 * Purpose: `BrandDisplayName`, the `displayName` section of `BrandingSettings`: the business name in each base locale
 *          (`en`, `ar`), each at most 80 characters or unset.
 * Boundary: a settings section, one level deep; its settings are `branding.displayName.en` and
 *           `branding.displayName.ar`. `BrandReader` picks the asked locale's name and falls back to the other. It
 *           registers its schema when the module loads (STA-339 replaces the registration).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 26); ADR 0307 (rules 22 to 24); STA-2644 (decision 2: per locale).
 */
import { registerSchemas, Schema, Str } from "@stackra/validation";

import { BRAND_DISPLAY_NAME_SCHEMA } from "#core/constants/brand-display-name-schema.constant";

/**
 * The name per base locale.
 *
 * @example
 * const { displayName } = await settings.get(BrandingSettings);
 * displayName.ar; // "متجر النخلة"
 */
export class BrandDisplayName extends Schema {
  /** The name in English. */
  @Str({ max: 80 })
  en: string | null = null;

  /** The name in Arabic. */
  @Str({ max: 80 })
  ar: string | null = null;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[BrandDisplayName, BRAND_DISPLAY_NAME_SCHEMA]]);
