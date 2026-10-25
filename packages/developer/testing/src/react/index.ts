/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/testing (thin wrappers over Testing Library for web tests:
 *          `render`, `renderHook`, `userEvent` with the house defaults, and Testing Library's own `screen`, `within`
 *          and `act`) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Provider-agnostic and free of workspace imports (ADR 0269
 *           decision 2 holds for every entry: every package's tests depend on this one). The route helpers
 *           (`renderRoute`, `renderLayout`, `runRouteLoader`, `runRouteSubmit`, `routeMeta`) need navigation, so they
 *           live in `@stackra/navigation/testing`.
 * Runtime: browser (vitest, jsdom)
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decisions 2 and 6); the STA-347 stand-in barrel decision.
 */
export { act, screen, within } from "@testing-library/react";
export { render } from "#react/render/render.function";
export type { RenderOptions } from "#react/render/render-options.type";
export { renderHook } from "#react/render-hook/render-hook.function";
export type { RenderHookOptions } from "#react/render-hook/render-hook-options.type";
export { userEvent } from "#react/user-event/user-event.constant";
