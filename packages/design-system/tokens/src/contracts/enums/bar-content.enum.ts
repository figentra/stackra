/**
 * Stackra file contract:
 * Purpose: `BarContent`, the tone of what a bar draws over a colour (the status bar's clock and icons, a navigation
 *          header's title and glass): `light` content on a dark colour, `dark` content on a light one, the names
 *          `expo-status-bar` and React Native's `StatusBar` read (`light` is `light-content`).
 * Boundary: the names only; `barContentOn` picks one from a colour.
 * Runtime: isomorphic
 * Governing contract: owner decision 2026-10-28 (the status bar and the top bar follow the theme); ADR 0320.
 */

/** The bar content tones. */
// shortcut: a frozen tuple, as MaterialMode, until @stackra/contracts ships Enum.of here (ADR 0128).
export const BarContent = Object.freeze(["light", "dark"] as const);

/** One bar content tone. */
export type BarContent = (typeof BarContent)[number];
