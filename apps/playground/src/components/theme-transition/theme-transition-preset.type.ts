/**
 * Stackra file contract:
 * Purpose: `ThemeTransitionPreset`: the id of one of `THEME_TRANSITIONS`, as `data-uniwind-transition` takes it.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 11).
 */
import type { THEME_TRANSITIONS } from "./theme-transitions.constant";

/** One transition preset's id. */
export type ThemeTransitionPreset = (typeof THEME_TRANSITIONS)[number]["id"];
