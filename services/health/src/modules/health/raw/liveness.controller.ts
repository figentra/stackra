/**
 * Stackra file contract:
 * Purpose: `LivenessController`, `GET /healthz`: the process is up. Answers 200 `{ "status": "up" }`; a draining app
 *          refuses the call before it reaches this class, which the generated adapter answers 503.
 * Boundary: checks nothing but that a request reached the handler, so it never calls a dependency and cannot fail
 *           because one is down (that is `/readyz`). `GET` and `HEAD` only; any other method is 405. A raw endpoint,
 *           so it takes no session, and it still runs behind every request guard.
 * Runtime: node
 * Governing contract: ADR 0190 (health); ADR 0294 (decisions 16 and 25: a raw endpoint is a Controller in `raw/`);
 *                     http-conventions (raw endpoints); registry gap R-27.
 */
import { Controller } from "@stackra/app/server";

import { isProbeMethod } from "#modules/health/functions/is-probe-method.function";
import { methodNotAllowed } from "#modules/health/functions/method-not-allowed.function";
import { probeResponse } from "#modules/health/functions/probe-response.function";

/**
 * The liveness probe.
 *
 * @example
 * // GET /healthz → 200 {"status":"up"}
 */
// The path is written as a literal so gen reads it from the syntax tree.
export class LivenessController extends Controller({ path: "/healthz" }) {
  /** Answers `up`. */
  async handle(request: Request): Promise<Response> {
    if (!isProbeMethod(request)) return methodNotAllowed();
    return probeResponse(request, 200, { status: "up" });
  }
}
