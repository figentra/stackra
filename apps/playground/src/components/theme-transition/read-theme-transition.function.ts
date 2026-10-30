/**
 * Stackra file contract:
 * Purpose: `readThemeTransition`: the transition this browser picked, or the default (a circle from the control).
 * Boundary: reads localStorage, guarded: a browser that refuses storage gets the default.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5).
 */
import { THEME_TRANSITION_KEY } from "./theme-transition-key.constant";
import type { ThemeTransitionPreset } from "./theme-transition-preset.type";
import { THEME_TRANSITIONS } from "./theme-transitions.constant";

/** The picked transition, `circle-origin` when none is stored or the stored one is unknown. */
export function readThemeTransition(): ThemeTransitionPreset {
  try {
    const stored = localStorage.getItem(THEME_TRANSITION_KEY);
    return THEME_TRANSITIONS.find(({ id }) => id === stored)?.id ?? "circle-origin";
  } catch {
    return "circle-origin";
  }
}
