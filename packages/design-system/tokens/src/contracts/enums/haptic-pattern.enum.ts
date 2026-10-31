/**
 * Stackra file contract:
 * Purpose: the haptic patterns a theme can give a haptic token: the `expo-haptics` calls (a selection tick, an impact
 *          of a weight, a notification of an outcome) and `none`, which plays nothing.
 * Boundary: the names only; `@stackra/ui/native` maps each to its `expo-haptics` call.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2, the motion family: haptics).
 */

/** The haptic patterns, as `expo-haptics` plays them. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the patterns carry no labels.
export const HapticPattern = Object.freeze([
  "selection",
  "impact-light",
  "impact-medium",
  "impact-heavy",
  "impact-rigid",
  "impact-soft",
  "notification-success",
  "notification-warning",
  "notification-error",
  "none",
] as const);

/** One haptic pattern. */
export type HapticPattern = (typeof HapticPattern)[number];
