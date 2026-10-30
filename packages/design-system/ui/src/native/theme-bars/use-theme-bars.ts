/**
 * Stackra file contract:
 * Purpose: `useThemeBars()`, how the status bar and a navigation header draw over the active brand and scheme: content
 *          tone from the theme background's lightness (`barContentOn`, so a light-yellow or a dark-pink brand gets the
 *          right one, not the scheme's guess), the glass tint (`barTint` at `BAR_SHARE`) and the foreground, solid
 *          under Reduce Transparency.
 * Boundary: reads the theme's colours (HeroUI Native's `useThemeColor`) and the device's Reduce Transparency setting;
 *           draws nothing. Until the setting answers, the bars are glass (the setting rarely changes mid-session).
 * Runtime: react-native
 * Governing contract: owner decision 2026-10-28 (the status bar and the top bar follow the theme); ADR 0320.
 */
import { barContentOn, barTint } from "@stackra/tokens";
import { useThemeColor } from "heroui-native";
import { useEffect, useMemo, useState } from "react";
import { AccessibilityInfo } from "react-native";

import { BAR_SHARE } from "#native/theme-bars/bar-share.constant";
import type { ThemeBars } from "#native/theme-bars/theme-bars.type";

/**
 * The bars of the active theme.
 *
 * @example
 * const bars = useThemeBars();
 * <StatusBar barStyle={`${bars.content}-content`} />
 */
export function useThemeBars(): ThemeBars {
  const [background, foreground] = useThemeColor(["background", "foreground"]);
  const [isSolid, setSolid] = useState(false);
  useEffect(() => {
    let isLive = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then((on) => {
      if (isLive) setSolid(on);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceTransparencyChanged", setSolid);
    return () => {
      isLive = false;
      subscription.remove();
    };
  }, []);
  return useMemo(
    () => ({
      content: barContentOn(background),
      background,
      foreground,
      tint: isSolid ? barTint(background, 1) : barTint(background, BAR_SHARE),
      isSolid,
    }),
    [background, foreground, isSolid],
  );
}
