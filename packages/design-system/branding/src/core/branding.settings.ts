/**
 * Stackra file contract:
 * Purpose: `BrandingSettings`, a tenant's brand profile as settings the console's generated page edits: the display
 *          name per base locale, the logo and the mark (ids of files claimed into `BrandAssetsBucket`), and the primary
 *          and accent colours (`#RRGGBB`), resolved through the settings cascade (platform, then the scope level
 *          tenancy contributes), field by field.
 * Boundary: the package's one settings group; its key is `branding` and its settings `branding.displayName.en`,
 *           `branding.displayName.ar`, `branding.logo`, `branding.mark`, `branding.primaryColor` and
 *           `branding.accentColor`. Every field defaults to unset (`null`): a surface draws plain until a level sets
 *           it. The registered schema holds the formats only. The contrast rules (`brandColorRefusals`) are not in it:
 *           the settings write path checks a value against its key's type only, so a low-contrast colour can be
 *           stored, and `BrandReader` treats it as unset; a save path refuses it (README, known limits). Code reads
 *           the group through `BrandReader`, never directly. Never a secret. It registers its
 *           schema when the module loads (STA-339 replaces the registration).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0307 (rules 22 to 24); ADR 0323 (decision 4); ADR 0213;
 *                     STA-2644 (FR-001).
 */
import { SettingScope, Settings } from "@stackra/settings";
import { TenancyScopes } from "@stackra/tenancy";
import { publicId, registerSchemas, Str } from "@stackra/validation";
import { z } from "zod";

import { BRAND_DISPLAY_NAME_SCHEMA } from "#core/constants/brand-display-name-schema.constant";
import type { BrandDisplayName } from "#core/schemas/brand-display-name.schema";

/** A name of at most 80 characters; unset, or a longer one, reads as null. */
const NAME = z.string().max(80).nullable().default(null).catch(null);

/** A `#RRGGBB` colour; unset, or any malformed value, reads as null. */
const COLOR = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/)
  .nullable()
  .default(null)
  .catch(null);

/**
 * The platform scope holds the defaults every tenant inherits field by field; a tenant overrides what it sets.
 *
 * @example
 * const { primaryColor } = await this.settings.get(BrandingSettings);
 */
export class BrandingSettings extends Settings({
  scopes: [SettingScope.Platform, TenancyScopes.Tenant],
}) {
  /** The logo: the id of a PNG or JPEG claimed into `BrandAssetsBucket`. */
  @Str({ pattern: /^upl_[0-9a-hjkmnp-tv-z]{26}$/ })
  logo: string | null = null;

  /** The square mark, the same kind of id; surfaces use the logo when it is unset. */
  @Str({ pattern: /^upl_[0-9a-hjkmnp-tv-z]{26}$/ })
  mark: string | null = null;

  /** The primary colour, `#RRGGBB`; white or `#111111` text on it must reach 4.5:1. */
  @Str({ pattern: /^#[0-9A-Fa-f]{6}$/ })
  primaryColor: string | null = null;

  /** The accent colour, `#RRGGBB`; it must reach 3:1 against white. */
  @Str({ pattern: /^#[0-9A-Fa-f]{6}$/ })
  accentColor: string | null = null;

  /** The business name per base locale, at most 80 characters each. */
  displayName!: BrandDisplayName;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339). Formats only, and a
// malformed value reads as null (`.catch`) because the settings page type-checks a write only: no stored value ever
// makes a read throw. Contrast is never a read rule (`BrandReader` ignores a failing colour, a save path refuses it with
// `brandColorRefusals`).
registerSchemas([
  [
    BrandingSettings,
    z.object({
      // the section's own schema stays strict for a save path; the read is lenient field by field
      displayName: z
        .object({ en: NAME, ar: NAME })
        .default(() => BRAND_DISPLAY_NAME_SCHEMA.parse({}))
        .catch(() => BRAND_DISPLAY_NAME_SCHEMA.parse({})),
      // an id that is not an upload's reads as null, so the reader never builds a path from it
      logo: publicId("upl").nullable().default(null).catch(null),
      mark: publicId("upl").nullable().default(null).catch(null),
      primaryColor: COLOR,
      accentColor: COLOR,
    }),
  ],
]);
