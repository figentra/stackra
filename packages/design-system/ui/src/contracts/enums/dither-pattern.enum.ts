/**
 * Stackra file contract:
 * Purpose: the six brand patterns `DitherArt` draws (brand rules §40): `strata` (the primary: the framework's floors
 *          over the engine core), `core` (ignition), `grid` (gen), `lanes` (Runway), `waves` (Flow) and `field` (a
 *          quiet background).
 * Boundary: the values only; the fields are `DITHER_FIELDS`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); brand rules §40; STA-2041.
 */

/** Every brand dither pattern, as a frozen list. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the patterns are brand names, never shown as words.
export const DitherPattern = Object.freeze([
  "strata",
  "core",
  "grid",
  "lanes",
  "waves",
  "field",
] as const);

/** One brand pattern. */
export type DitherPattern = (typeof DitherPattern)[number];
