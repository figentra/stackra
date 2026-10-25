/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/navigation (`runLoader` and its extension point, and React
 *          Router's `createRoutesStub` for mounting a component under a stub route) until `stackra gen` writes the
 *          entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing; test-only code, never imported by a runtime entry.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decisions 3 and 6); the STA-347 stand-in barrel decision.
 */
export { createRoutesStub } from "react-router";
export { registerRouteTestingPart } from "#testing/functions/register-route-testing-part.function";
export { runLoader } from "#testing/functions/run-loader.function";
export type { RouteLoaderInput } from "#testing/types/route-loader-input.type";
export type { RouteLoaderRun } from "#testing/types/route-loader-run.type";
export type { RouteTestingContribution } from "#testing/types/route-testing-contribution.type";
export type { RouteTestingPart } from "#testing/types/route-testing-part.type";
