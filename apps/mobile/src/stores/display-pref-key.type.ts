/**
 * Stackra file contract:
 * Purpose: `DisplayPrefKey`: the names of the remembered display settings in `displayPrefs`.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12: one declaration per file).
 */

/** One remembered display setting. */
export type DisplayPrefKey =
  | "scheme"
  | "locale"
  | "brand"
  | "transition"
  | "haptics"
  | "hero"
  | "numerals";
