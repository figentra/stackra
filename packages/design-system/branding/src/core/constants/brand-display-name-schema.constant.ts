/**
 * Stackra file contract:
 * Purpose: `BRAND_DISPLAY_NAME_SCHEMA`, the zod schema of the display-name section, shared by `BrandDisplayName` and
 *          the `BrandingSettings` group that nests it.
 * Boundary: internal; the stand-in for what gen writes into `#stackra/schemas` (STA-339). Its defaults equal the section
 *           class's initializers.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0307 (rules 22 to 24).
 */
import { z } from "zod";

/** The section's shape and defaults. */
export const BRAND_DISPLAY_NAME_SCHEMA = z.object({
  en: z.string().max(80).nullable().default(null),
  ar: z.string().max(80).nullable().default(null),
});
