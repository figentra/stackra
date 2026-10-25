/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/testing (thin wrappers over Testing Library for web tests:
 *          `render`, `renderHook`, `userEvent` with the house defaults, Testing Library's own `screen`, `within` and
 *          `act`, and the route helpers `renderRoute`, `renderLayout`, `runRouteLoader`, `runRouteSubmit` and
 *          `routeMeta`) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The render helpers are provider-agnostic and import no
 *           workspace package. The route helpers are `@stackra/navigation/testing`'s own, offered here so an app's
 *           route tests import one entry (registry v3.1: `./react` depends on navigation); navigation is an optional
 *           peer and a dev dependency (so the module resolves); navigation's tests import vitest directly, so there is
 *           no turbo cycle.
 * Runtime: browser (vitest, jsdom)
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decisions 2 and 6); the STA-347 stand-in barrel decision.
 */
export {
  renderLayout,
  renderRoute,
  routeMeta,
  runRouteLoader,
  runRouteSubmit,
} from "@stackra/navigation/testing";
export { act, screen, within } from "@testing-library/react";
export { render } from "#react/render/render.function";
export type { RenderOptions } from "#react/render/render-options.type";
export { renderHook } from "#react/render-hook/render-hook.function";
export type { RenderHookOptions } from "#react/render-hook/render-hook-options.type";
export { userEvent } from "#react/user-event/user-event.constant";
