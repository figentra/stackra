/**
 * Stackra file contract:
 * Purpose: `renderLayout(Layout, options?)`, a layout mounted in a web test: its loader runs through the route context
 *          the testing parts fill, its component (`options.component`) renders over an empty outlet under a React
 *          Router stub at `options.path` (`/` when left out), and the result carries the parts' fakes.
 * Boundary: test only; built on `@stackra/testing/react`'s `render`, so the providers are the caller's. Without a
 *           component only the loader runs (a redirect test). The loader resolves after the first paint, so read the
 *           frame with `findBy`.
 * Runtime: browser
 * Governing contract: ADR 0269 (decisions 3 and 6); ADR 0294 (decisions 14 and 16).
 */
import type { LayoutClass } from "#core/types/layout-class.type";
import { mountRoute } from "#testing/functions/mount-route.function";
import type { RenderRouteOptions } from "#testing/types/render-route-options.type";
import type { RenderRouteResult } from "#testing/types/render-route-result.type";

/**
 * Mounts `type` with its component.
 *
 * @example
 * renderLayout(ShellLayout, { component: Shell, path: "/", providers: [I18nTestProvider], session });
 * await screen.findByRole("navigation", { name: "Main navigation" });
 */
export function renderLayout(
  type: LayoutClass,
  options: RenderRouteOptions = {},
): RenderRouteResult {
  return mountRoute(type, options);
}
