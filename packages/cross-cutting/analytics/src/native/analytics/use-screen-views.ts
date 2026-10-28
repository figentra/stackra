/**
 * Stackra file contract:
 * Purpose: `useScreenViews(screen)`, the native auto-capture hook the app shell (or @stackra/navigation's
 *          `ReactNavigationProvider`) calls with the focused route's name: it tracks `screen.viewed` once per screen
 *          change while `AnalyticsConfig.autocapturePageviews` is on.
 * Boundary: reads the `AnalyticsClient` and `AnalyticsConfig` of the nearest container; consent stays in the client.
 *           Only the route name leaves, never its params. A repeat of the same screen is not tracked again. Taps are
 *           not auto-captured on native (React Native has no event delegation); track them explicitly.
 * Runtime: react-native
 * Governing contract: ADR 0298 (decision 5); ADR 0071; analytics gap 9 (stackra-409).
 */
import { useContainer } from "@stackra/container/react";
import { useEffect, useRef } from "react";

import { AnalyticsConfig, AnalyticsClient, ScreenViewed } from "#core/index";

/**
 * Tracks screen views on a native surface while `autocapturePageviews` is on.
 *
 * @param screen - the focused route's name (`navigationRef.getCurrentRoute()?.name`).
 * @example
 * useScreenViews(routeName);
 */
export function useScreenViews(screen: string): void {
  const container = useContainer();
  const analytics = container.get(AnalyticsClient);
  const config = container.get(AnalyticsConfig);
  const viewed = useRef<string | null>(null);

  useEffect(() => {
    if (!config.autocapturePageviews || screen === "" || viewed.current === screen) return;
    viewed.current = screen;
    analytics.track(ScreenViewed.create({ screen }));
  }, [analytics, config, screen]);
}
