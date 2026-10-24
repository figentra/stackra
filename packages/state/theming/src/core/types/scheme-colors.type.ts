/**
 * Stackra file contract:
 * Purpose: `SchemeColors`, one colour per resolved scheme: the `<meta name="theme-color">`, Android status bar and
 *          adaptive icon colour (`ThemingConfig.themeColor`) and the native splash background.
 * Boundary: a type only; the values are `#RRGGBB` or `#RRGGBBAA` hex, because the native splash and the web manifest
 *           cannot read CSS variables. A host takes them from its theme's tokens (`hexLight`, `hexDark`).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 2: tokens with hex equivalents); ADR 0294 (decision 8: no anonymous object
 *                     type in an exported signature).
 */

/** A colour for the light scheme and one for the dark. */
export interface SchemeColors {
  /** The colour while the light scheme is on screen. */
  readonly light: string;

  /** The colour while the dark scheme is on screen. */
  readonly dark: string;
}
