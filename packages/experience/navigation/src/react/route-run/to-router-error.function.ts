/**
 * Stackra file contract:
 * Purpose: `toRouterError(error, href, reporter?)`, what a loader or submit throws, as React Router expects it: a
 *          redirect and a `RouteResponse` as their router forms, a `Response` as it is, a refusal as an error response
 *          with its kind's status and code (so `notFound`-style refusals render the 404 page); anything else is
 *          reported once to the error reporter and rethrown for the error boundary.
 * Boundary: internal to `./react`; returns the value to throw, never throws itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 35: the root boundary reports through the reporter port); ADR 0140; ADR 0232.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import type { ErrorReporter } from "@stackra/errors/contracts";
import { data as routerData } from "react-router";

import { isRouteRedirect } from "#core/functions/is-route-redirect.function";
import { isRouteResponse } from "#core/functions/is-route-response.function";
import type { HrefParams } from "#core/types/href-params.type";
import type { RouteTarget } from "#core/types/route-target.type";
import { toRouterAnswer } from "#react/route-run/to-router-answer.function";

/**
 * The value to throw for `error`.
 *
 * @example
 * catch (error) { throw toRouterError(error, ctx.href, reporter); }
 */
export function toRouterError(
  error: unknown,
  href: (to: RouteTarget, params?: HrefParams) => string,
  reporter?: ErrorReporter,
): unknown {
  if (isRouteRedirect(error) || isRouteResponse(error)) return toRouterAnswer(error, href);
  if (error instanceof Response) return error;
  if (isRefusal(error))
    return routerData(
      { code: error.code, kind: error.kind },
      { status: Enum.meta(ErrorKind, error.kind).httpStatus },
    );
  reporter?.report(error);
  return error;
}
