/**
 * Stackra file contract:
 * Purpose: the colour schemes a user picks: light, dark, or the system's preference.
 * Boundary: the values only; each provider applies the scheme on its runtime.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (light and dark).
 */

/** The colour schemes; `system` follows the operating system's preference. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); labels belong to the app's i18n.
export const ColorScheme = Object.freeze(["light", "dark", "system"] as const);

/** One colour scheme. */
export type ColorScheme = (typeof ColorScheme)[number];
