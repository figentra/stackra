/**
 * Stackra file contract:
 * Purpose: `BrandLogoSource`, a logo URL per resolved scheme that a `BrandLogo` draws in place of the theme's own (a
 *          branding preview, a logo the host fetched); `null` for a scheme draws the fallback.
 * Boundary: a type only (ADR 0294 decision 8: no anonymous object type in an exported signature).
 * Runtime: isomorphic
 * Governing contract: ADR 0060 (light and dark); ADR 0294 (decision 8); ADR 0504 (module UI kits).
 */

/** A logo for the light scheme and one for the dark. */
export interface BrandLogoSource {
  /** The logo's URL while the light scheme is on screen; `null` for none. */
  readonly light: string | null;

  /** The logo's URL while the dark scheme is on screen; `null` for none. */
  readonly dark: string | null;
}
