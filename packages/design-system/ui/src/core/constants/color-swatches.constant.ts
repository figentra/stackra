/**
 * Stackra file contract:
 * Purpose: `COLOR_SWATCHES`, the ready-made colours a ColorPicker and a SettingsColorCell offer by default.
 * Boundary: data only; brand colours come from the caller's `swatches`.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28).
 */

/** The default swatches, `#rrggbb`. */
export const COLOR_SWATCHES: readonly string[] = Object.freeze([
  "#0f172a",
  "#475569",
  "#dc2626",
  "#ea580c",
  "#d97706",
  "#16a34a",
  "#0d9488",
  "#0284c7",
  "#4f46e5",
  "#9333ea",
  "#db2777",
  "#ffffff",
]);
