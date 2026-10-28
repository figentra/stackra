/**
 * Stackra file contract:
 * Purpose: the `ReportRunner` port: runs one report for a request under the caller's session and returns its groups,
 *          totals and cursor. Each report's generated query (`#stackra/reports`) injects it.
 * Boundary: an abstract class that is its own token, keyed `reports.ReportRunner`. In `core` because it speaks the
 *           core `ReportClass`, `ReportRequest` and `ReportResult`. The Postgres driver is `ReportCompiler` in
 *           `@stackra/reports/node` (stackra-390): one parameterised statement, `visibleFilter` and row-level security,
 *           the read replica, a statement timeout and a row cap. No driver ships here.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decisions 3 and 8); ADR 0142 (drivers behind a port); ADR 0294 (decisions 4 and 16).
 */
import { Port } from "@stackra/contracts";

import type { ReportClass } from "#core/types/report-class.type";
import type { ReportRequest } from "#core/types/report-request.type";
import type { ReportResult } from "#core/types/report-result.type";

/**
 * Runs reports.
 *
 * @example
 * const result = await container.get(ReportRunner).run(OrderSalesReport, { dimensions: [{ name: "placedAt", grain: TimeGrain.Month }], measures: ["revenue"] });
 */
export abstract class ReportRunner extends Port {
  /** Type-only port key, so `DriverName<ReportRunner>` narrows to this port's drivers. */
  declare readonly "~key": "reports.ReportRunner";

  /**
   * Runs `report` for `request` as the current caller.
   *
   * @throws a validation refusal when the request names a dimension, grain or measure the report does not declare.
   */
  abstract run(report: ReportClass, request: ReportRequest): Promise<ReportResult>;
}
