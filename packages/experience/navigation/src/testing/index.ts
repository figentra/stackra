/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/navigation (the route helpers `renderRoute`,
 *          `renderLayout`, `runRouteLoader`, `runRouteSubmit` and `routeMeta`, their extension point
 *          `registerRouteTestingPart`, and React Router's `createRoutesStub`) until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names each re-export and declares nothing; test-only code, never imported by a runtime entry. Web only
 *           (React Router): the native `renderRoute` for React Navigation is not here.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decisions 3 and 6); the STA-347 stand-in barrel decision.
 */
export { createRoutesStub } from "react-router";
export { registerRouteTestingPart } from "#testing/functions/register-route-testing-part.function";
export { renderLayout } from "#testing/functions/render-layout.function";
export { renderRoute } from "#testing/functions/render-route.function";
export { routeMeta } from "#testing/functions/route-meta.function";
export { runRouteLoader } from "#testing/functions/run-route-loader.function";
export { runRouteSubmit } from "#testing/functions/run-route-submit.function";
export type { RenderRouteOptions } from "#testing/types/render-route-options.type";
export type { RenderRouteResult } from "#testing/types/render-route-result.type";
export type { RouteLoaderInput } from "#testing/types/route-loader-input.type";
export type { RouteLoaderRun } from "#testing/types/route-loader-run.type";
export type { RouteMetaInput } from "#testing/types/route-meta-input.type";
export type { RouteSubmitInput } from "#testing/types/route-submit-input.type";
export type { RouteTestingContribution } from "#testing/types/route-testing-contribution.type";
export type { RouteTestingPart } from "#testing/types/route-testing-part.type";
