/**
 * Stackra file contract:
 * Purpose: `ReadinessController`, `GET /readyz`: the service can serve. Answers 200 when no health indicator is down
 *          (the database, the migrations and the actions pipeline among them) and 503 otherwise, with each indicator's
 *          status by name: `{ "database": "up", "migrations": "down" }`.
 * Boundary: delegates to `ReadinessService` and adds only the HTTP shape. `GET` and `HEAD` only; any other method is
 *           405. A raw endpoint, so it takes no session, and it still runs behind every request guard. A deploy check
 *           (runway's `verify`) reads this route.
 * Runtime: node
 * Governing contract: ADR 0190 (health); ADR 0294 (decisions 16 and 25: a raw endpoint is a Controller in `raw/`);
 *                     http-conventions (raw endpoints); registry gap R-27.
 */
import { Controller } from "@stackra/app/server";

import { isProbeMethod } from "#modules/health/functions/is-probe-method.function";
import { methodNotAllowed } from "#modules/health/functions/method-not-allowed.function";
import { probeResponse } from "#modules/health/functions/probe-response.function";
import type { ReadinessService } from "#modules/health/services/readiness.service";

/**
 * The readiness probe.
 *
 * @example
 * // GET /readyz → 200 {"database":"up","migrations":"up","pipeline":"up"}
 */
// The path is written as a literal so gen reads it from the syntax tree.
export class ReadinessController extends Controller({ path: "/readyz" }) {
  private readonly readiness: ReadinessService;

  /**
   * @param readiness - runs the indicators.
   */
  constructor(readiness: ReadinessService) {
    super();
    this.readiness = readiness;
  }

  /** Runs every indicator and answers their statuses. */
  async handle(request: Request): Promise<Response> {
    if (!isProbeMethod(request)) return methodNotAllowed();
    const { status, body } = await this.readiness.check();
    return probeResponse(request, status, body);
  }
}
