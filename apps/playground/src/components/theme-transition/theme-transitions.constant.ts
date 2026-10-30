/**
 * Stackra file contract:
 * Purpose: `THEME_TRANSITIONS`: the transitions a scheme, locale, material or brand change can play, the presets of
 *          Uniwind Pro's `view-transition.css` (the same names as on mobile); each one's words are `shell::shell.transitions.<id>`
 *          with the id in snake_case.
 * Boundary: data only.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 11: Uniwind Pro); ADR 0302 (decision 5).
 */

/** The transitions a scheme, locale, material or brand change can play. */
export const THEME_TRANSITIONS = [
  { id: "circle-origin" },
  { id: "slide-origin" },
  { id: "circle-center" },
  { id: "circle-top-right" },
  { id: "circle-top-left" },
  { id: "circle-bottom-right" },
  { id: "circle-bottom-left" },
  { id: "slide-rtl" },
  { id: "slide-ltr" },
  { id: "fade" },
  { id: "blur" },
  { id: "none" },
] as const;
