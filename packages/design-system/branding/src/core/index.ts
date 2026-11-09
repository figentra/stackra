/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/branding (the `BrandingSettings` group and its display-name
 *          section, the contrast refusal, and the contrast functions `onColor` and `brandColorRefusals`; the
 *          ratio itself is `contrastRatio` of @stackra/tokens) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Isomorphic: a browser surface may read the settings group and
 *           the contrast maths; `BrandReader` and the bucket are server code in `./node`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { BrandingSettings } from "#core/branding.settings";
export { BrandColorContrastError } from "#core/errors/brand-color-contrast.error";
export { brandColorRefusals } from "#core/functions/brand-color-refusals.function";
export { onColor } from "#core/functions/on-color.function";
export { BrandDisplayName } from "#core/schemas/brand-display-name.schema";
