/**
 * Stackra file contract:
 * Purpose: the `ReportEngine` port: the store a checked report run executes on. It takes one report's declaration, its
 *          source model, the caller's request and time zone, and returns the page of groups, the grand totals and the
 *          next cursor. Which engine runs is configuration (`ReportsConfig.engine`), never code.
 * Boundary: an abstract class that is its own token, keyed `reports.ReportEngine`. It speaks only the engine types of
 *           this leaf entry, so an engine package imports `@stackra/reports/contracts` and nothing else of reports.
 *           `ReportRunner` (core) resolves the report class and the call, then hands the run here. The `postgres`
 *           driver ships in `@stackra/reports/node` (stackra-398); `clickhouse` and `duckdb` are Pro drivers for later
 *           (stackra-417, ADR 0461). An engine applies record visibility and scope isolation itself; it never widens
 *           what the caller may read.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 8: one engine now, a port for the others); ADR 0227 and ADR 0190 (decision 3:
 *                     the OLAP engine stays deferred behind a driver); ADR 0142 (drivers behind a port); ADR 0294
 *                     (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";

import type { ReportEngineQuery } from "#contracts/types/report-engine-query.type";
import type { ReportEngineResult } from "#contracts/types/report-engine-result.type";

/**
 * Executes report runs on one store.
 *
 * @example
 * const result = await engine.run({ declaration, source: Order, request: { dimensions: [], measures: ["orders"] }, timeZone: "UTC" });
 */
export abstract class ReportEngine extends Port {
  /** Type-only port key, so `DriverName<ReportEngine>` narrows to this port's drivers. */
  declare readonly "~key": "reports.ReportEngine";

  /**
   * Runs `query` as the current caller.
   *
   * @throws a validation refusal when the request names a dimension, grain, measure, sort key, pivot axis, limit or
   *         cursor the declaration does not allow.
   */
  abstract run(query: ReportEngineQuery): Promise<ReportEngineResult>;
}
