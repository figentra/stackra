/**
 * Stackra file contract:
 * Purpose: `registerReportSources`, how generated code tells the report runner which model a `Report<Source>` class
 *          reads, since the type argument is gone at run time.
 * Boundary: called by generated wiring with `[report, model]` pairs; a later pair for the same class replaces it. A
 *           projection-row source is not a model and is not registered here.
 * Runtime: node
 * Governing contract: ADR 0305 (rule 5: partners by type argument); ADR 0470 (decision 1).
 */
import type { AnyClass } from "@stackra/container";

import type { ReportClass } from "#core/types/report-class.type";
import { REPORT_SOURCES } from "#node/constants/report-sources.constant";

/**
 * Registers `[report, model]` pairs.
 *
 * @example
 * registerReportSources([[OrderSalesReport, Order]]);
 */
export function registerReportSources(
  pairs: readonly (readonly [report: ReportClass, model: AnyClass])[],
): void {
  for (const [report, model] of pairs) REPORT_SOURCES.set(report, model);
}
