/**
 * Stackra file contract:
 * Purpose: public surface of the theme-transition component folder: the runner, the stored pick and the presets (the setting is the shell's `DisplaySettings`).
 * Boundary: re-exports only.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 14).
 */
export { runThemeTransition } from "./run-theme-transition.function";
export { readThemeTransition } from "./read-theme-transition.function";
export { THEME_TRANSITION_KEY } from "./theme-transition-key.constant";
export { THEME_TRANSITIONS } from "./theme-transitions.constant";
export { type ThemeTransitionPreset } from "./theme-transition-preset.type";
