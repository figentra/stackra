/**
 * Stackra file contract:
 * Purpose: `useBarHeader()`, the theme-following header options (`barHeaderOptions`) of the active brand and scheme,
 *          for a navigator's `screenOptions`; `isLargeTitle` for a large-title stack.
 * Boundary: a React hook over `useThemeBars()`; stable while the theme is.
 * Runtime: react-native
 * Governing contract: owner decision 2026-10-28 (the top bar follows the theme).
 */
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { useThemeBars } from "@stackra/ui/native";
import { useMemo } from "react";

import { barHeaderOptions } from "./bar-header-options.function";

/** The header options that follow the theme. */
export function useBarHeader(isLargeTitle = false): NativeStackNavigationOptions {
  const bars = useThemeBars();
  return useMemo(() => barHeaderOptions(bars, isLargeTitle), [bars, isLargeTitle]);
}
