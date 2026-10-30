/**
 * Stackra file contract:
 * Purpose: `useThemeTransition`, the app's theme transition preset as a React hook, re-rendering on every change of
 *          `themeTransition`.
 * Boundary: reads the store through `useSyncExternalStore`; no state of its own.
 * Runtime: react-native
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0128 (decision 5, hook files).
 */
import { useSyncExternalStore } from "react";
import type { ThemeTransitionPreset } from "uniwind";

import { themeTransition } from "./theme-transition.store";

/** The app's theme transition preset, re-rendering on every change. */
export function useThemeTransition(): ThemeTransitionPreset {
  return useSyncExternalStore(themeTransition.subscribe, themeTransition.getSnapshot);
}
