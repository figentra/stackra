/**
 * Stackra file contract:
 * Purpose: `ThemeStatusBar`, the status bar that follows the theme: light content (a white clock and icons) over a
 *          dark background and dark content over a light one, by the active brand and scheme's background lightness
 *          (`useThemeBars`), so a light-yellow or dark-pink brand reads right; a screen whose top is a hero mounts its
 *          own with `over` (the hero's colour) while focused, and the last mounted one wins (React Native's status
 *          bar stack).
 * Boundary: the status bar's content style only; the bar stays translucent (edge to edge) on Android and iOS.
 * Runtime: react-native
 * Governing contract: owner decision 2026-10-28 (the status bar follows the theme).
 */
import { barContentOn } from "@stackra/tokens";
import { StatusBar } from "react-native";
import type { ReactElement } from "react";

import type { ThemeStatusBarProps } from "#native/theme-bars/theme-status-bar.props";
import { useThemeBars } from "#native/theme-bars/use-theme-bars";

/** The status bar in the theme's content tone, or the tone of `over`. */
export function ThemeStatusBar({
  over,
  isActive = true,
}: ThemeStatusBarProps): ReactElement | null {
  const { content } = useThemeBars();
  if (!isActive) return null;
  const tone = over === undefined ? content : barContentOn(over, content);
  return (
    <StatusBar barStyle={`${tone}-content`} translucent backgroundColor="transparent" animated />
  );
}
