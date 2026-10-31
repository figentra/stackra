/**
 * Stackra file contract:
 * Purpose: `ThemeLocale`, part of the token schema of the Stackra Design System (see `Theme`): the direction and
 *          numbering choices a theme makes for its locales (ADR 0501).
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2).
 */
/** Direction and digits. */
export interface ThemeLocale {
  /** Whether a directional icon (`.rtl-mirror`) flips in a right-to-left layout, through `--mirror` (1 or -1). */
  readonly mirrorIcons: boolean;
  /** The numbering system a number formatter uses, `latn` (0-9) or `arab` (Arabic-Indic digits). */
  readonly digits: "latn" | "arab";
}
