/**
 * Stackra file contract:
 * Purpose: `SCHEME_ICONS`: the icon of each colour scheme choice in the display settings and the command palette.
 * Boundary: data only; the choice's accessible name is its catalogue word.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12: one declaration per file).
 */

/** The icon of each scheme choice. */
export const SCHEME_ICONS = {
  /** The icon of the light scheme. */
  light: "sun",
  /** The icon of the dark scheme. */
  dark: "moon",
  /** The icon of following the system scheme. */
  system: "monitor",
} as const;
