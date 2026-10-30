/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/reports until `stackra gen` writes the entry barrels
 *          (STA-339): the `ReportEngine` port and the engine-neutral types an engine package implements, and the
 *          `ProductAnalytics` port (funnels, retention, cohorts) with its query and result types, and the `Forecaster`
 *          port (series forecasts with an 80% band) with its query and row types.
 * Boundary: the leaf entry: names each re-export, declares nothing and imports no other entry of this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0470 (decision 8); ADR 0163 (decision 5 as amended
 *                     2026-10-28); ADR 0492 (decision 8); the STA-347 stand-in barrel decision.
 */
export { RetentionPeriod } from "#contracts/enums/retention-period.enum";
export { Forecaster } from "#contracts/ports/forecaster.port";
export { ProductAnalytics } from "#contracts/ports/product-analytics.port";
export { ReportEngine } from "#contracts/ports/report-engine.port";
export type { AnalyticsDateRange } from "#contracts/types/analytics-date-range.type";
export type { AnalyticsEventMatch } from "#contracts/types/analytics-event-match.type";
export type { AnalyticsPropertyValue } from "#contracts/types/analytics-property-value.type";
export type { CohortBucket } from "#contracts/types/cohort-bucket.type";
export type { CohortQuery } from "#contracts/types/cohort-query.type";
export type { CohortResult } from "#contracts/types/cohort-result.type";
export type { ForecastFrequency } from "#contracts/types/forecast-frequency.type";
export type { ForecastModel } from "#contracts/types/forecast-model.type";
export type { ForecastQuery } from "#contracts/types/forecast-query.type";
export type { ForecastRow } from "#contracts/types/forecast-row.type";
export type { ForecastSeries } from "#contracts/types/forecast-series.type";
export type { FunnelQuery } from "#contracts/types/funnel-query.type";
export type { FunnelResult } from "#contracts/types/funnel-result.type";
export type { FunnelStepResult } from "#contracts/types/funnel-step-result.type";
export type { ReportEngineDeclaration } from "#contracts/types/report-engine-declaration.type";
export type { ReportEngineDimension } from "#contracts/types/report-engine-dimension.type";
export type { ReportEngineMeasure } from "#contracts/types/report-engine-measure.type";
export type { ReportEnginePivot } from "#contracts/types/report-engine-pivot.type";
export type { ReportEngineQuery } from "#contracts/types/report-engine-query.type";
export type { ReportEngineRequest } from "#contracts/types/report-engine-request.type";
export type { ReportEngineResult } from "#contracts/types/report-engine-result.type";
export type { ReportEngineSubtotal } from "#contracts/types/report-engine-subtotal.type";
export type { RetentionCohortRow } from "#contracts/types/retention-cohort-row.type";
export type { RetentionQuery } from "#contracts/types/retention-query.type";
export type { RetentionResult } from "#contracts/types/retention-result.type";
