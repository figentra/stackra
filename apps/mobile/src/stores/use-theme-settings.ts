/**
 * Stackra file contract:
 * Purpose: `useThemeSettings`, the app's theme settings as a React hook, re-rendering on every change of
 *          `themeSettings`.
 * Boundary: reads the store through `useSyncExternalStore`; no state of its own.
 * Runtime: react-native
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0302 (Stackra Design System); ADR 0305 (rule 10). ADR 0128
 *                     (decision 5, hook files).
 */
import { useSyncExternalStore } from "react";
import { themeSettings } from "./theme-settings.store";
import type { ThemeSettings } from "./theme-settings.type";

/** The app's theme settings, re-rendering on every change. */
export function useThemeSettings(): ThemeSettings {
  return useSyncExternalStore(themeSettings.subscribe, themeSettings.getSnapshot);
}
