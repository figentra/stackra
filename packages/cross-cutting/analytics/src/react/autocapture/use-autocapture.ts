/**
 * Stackra file contract:
 * Purpose: `useAutocapture(path)`, the web auto-capture hook the app shell (or @stackra/navigation's router root)
 *          calls with the current location: it tracks `page.viewed` once per path change while
 *          `AnalyticsConfig.autocapturePageviews` is on, and, while `autocaptureClicks` is on, one capture-phase click
 *          listener on the document tracks `element.clicked` for a click inside an element carrying `data-track`.
 * Boundary: reads the `AnalyticsClient` and `AnalyticsConfig` of the nearest container; consent stays in the client.
 *           Only the path (no query or hash) and the author's `data-track` name leave, never element text, values or
 *           other attributes; a `data-track` value that is not a plain name is skipped. A repeat of the same path
 *           (a re-render, React's development double effect) is not tracked again. No router import: the caller
 *           passes the path, so this package stays free of the router.
 * Runtime: browser
 * Governing contract: ADR 0298 (decision 5); ADR 0071; analytics gap 9 (stackra-409).
 */
import { useContainer } from "@stackra/container/react";
import { useEffect, useRef } from "react";

import { AnalyticsConfig, AnalyticsClient, ElementClicked, PageViewed } from "#core/index";
import { pagePath } from "#core/functions/page-path.function";
import { TRACK_NAME_PATTERN } from "#core/constants/track-name-pattern.constant";

/**
 * Tracks page views and `data-track` clicks on a web surface, as `AnalyticsConfig` switches them on.
 *
 * @param location - the current location (`useLocation().pathname`); a query or hash is removed.
 * @example
 * const { pathname } = useLocation();
 * useAutocapture(pathname);
 */
export function useAutocapture(location: string): void {
  const container = useContainer();
  const analytics = container.get(AnalyticsClient);
  const config = container.get(AnalyticsConfig);
  const path = pagePath(location);
  const current = useRef(path);
  const viewed = useRef<string | null>(null);

  useEffect(() => {
    current.current = path;
  }, [path]);

  useEffect(() => {
    if (!config.autocapturePageviews || viewed.current === path) return;
    viewed.current = path;
    analytics.track(PageViewed.create({ path }));
  }, [analytics, config, path]);

  useEffect(() => {
    const document = (globalThis as { readonly document?: Document }).document;
    if (!config.autocaptureClicks || document === undefined) return undefined;
    const onClick = (event: MouseEvent): void => {
      const target = event.target as { closest?: (selector: string) => Element | null } | null;
      const name = target?.closest?.("[data-track]")?.getAttribute("data-track");
      if (name === undefined || name === null || !TRACK_NAME_PATTERN.test(name)) return;
      analytics.track(ElementClicked.create({ target: name, path: current.current }));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [analytics, config]);
}
