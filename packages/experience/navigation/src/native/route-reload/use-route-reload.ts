/**
 * Stackra file contract:
 * Purpose: `useRouteReload()`, the reload of the screen a page is rendered in: `onRefresh={this.reload.run}` and
 *          `isRefreshing={this.reload.isRunning}` on a list.
 * Boundary: reads the screen `toScreen` renders.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 16).
 */
import { use } from "react";

import { RouteReloadContext } from "#native/route-reload/route-reload-context";
import type { RouteReload } from "#native/route-reload/route-reload.type";

/**
 * The current screen's reload.
 *
 * @throws Error outside a screen built by `toScreen`.
 * @example
 * reload = useRouteReload();
 */
export function useRouteReload(): RouteReload {
  const reload = use(RouteReloadContext);
  if (reload === null) throw new Error("useRouteReload() needs a screen built by toScreen");
  return reload;
}
