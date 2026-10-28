/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/reports until `stackra gen` writes the entry barrels (STA-339):
 *          the `Report` kind base, its vocabulary enums, the formula grammar check, the `ReportRunner` port and the
 *          public types.
 * Boundary: names each re-export and declares nothing. `ReportBase` is exported as a type only, so no report skips its
 *           options.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0470; the STA-347 stand-in barrel decision.
 */
export { Report } from "#core/bases/report.base";
export type { ReportBase } from "#core/bases/report-base.base";
export { MeasureKind } from "#core/enums/measure-kind.enum";
export { ReportMetric } from "#core/enums/report-metric.enum";
export { TimeGrain } from "#core/enums/time-grain.enum";
export { formulaNames } from "#core/functions/formula-names.function";
export { ReportRunner } from "#core/ports/report-runner.port";
export type { ReportClass } from "#core/types/report-class.type";
export type { ReportDeclaration } from "#core/types/report-declaration.type";
export type { ReportDimension } from "#core/types/report-dimension.type";
export type { ReportMeasure } from "#core/types/report-measure.type";
export type { ReportOptions } from "#core/types/report-options.type";
export type { ReportPath } from "#core/types/report-path.type";
export type { ReportRequest } from "#core/types/report-request.type";
export type { ReportResult } from "#core/types/report-result.type";
