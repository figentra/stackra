/**
 * Stackra file contract:
 * Purpose: the `animate` every native chart series gets by default (ADR 0329): a timing run on the theme's `reveal`
 *          step, so a series moves to its new values when its data changes instead of jumping. Reanimated's timing
 *          follows the system's reduce-motion setting by default, so the change is instant there.
 * Boundary: data only, in victory-native's `PathAnimationConfig` shape; one object, so its identity stays stable
 *           across renders (victory-native restarts the animation when the config's identity changes).
 * Runtime: react-native
 * Governing contract: ADR 0329 (motion layer).
 */
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";

/** A series' data-change animation: a timing run on the theme's reveal step. */
export const CHART_SERIES_ANIMATE = {
  type: "timing",
  duration: motionTiming(STACKRA_THEME, "reveal").durationMs,
} as const;
