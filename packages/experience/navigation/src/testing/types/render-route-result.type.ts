/**
 * Stackra file contract:
 * Purpose: `RenderRouteResult`, what `renderRoute` and `renderLayout` return: Testing Library's render result with the
 *          fakes the testing parts supplied (`RouteLoaderRun`, open for their members).
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0269 (decisions 3 and 6).
 */
import type { render } from "@stackra/testing/react";

import type { RouteLoaderRun } from "#testing/types/route-loader-run.type";

/** A mounted route or layout and its fakes. */
export type RenderRouteResult = ReturnType<typeof render> & RouteLoaderRun;
