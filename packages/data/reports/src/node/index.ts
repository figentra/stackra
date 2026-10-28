/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/reports until `stackra gen` writes the entry barrels
 *          (STA-339): the engine report runner (`EngineReportRunnerDriver`, the `ReportRunner` driver), the Postgres
 *          report engine (`PostgresReportEngineDriver`, the report compiler), the PostHog product analytics
 *          driver (`PosthogProductAnalyticsDriver`, funnels, retention and cohorts), their configuration, the source
 *          registration generated wiring calls, and the refusals.
 * Boundary: names each re-export and declares nothing. Node only: the driver reaches the database.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0470 (decisions 3 and 8); ADR 0163 (decision 5 as
 *                     amended 2026-10-28); the STA-347 stand-in barrel decision.
 */
export { ReportsConfig } from "#node/config/reports.config";
export { REPORTS_CONFIG_SCHEMA as ReportsConfig$ } from "#node/constants/reports-config-schema.constant";
export { EngineReportRunnerDriver } from "#node/drivers/engine-report-runner.driver";
export { PosthogProductAnalyticsDriver } from "#node/drivers/posthog-product-analytics.driver";
export { PostgresReportEngineDriver } from "#node/drivers/postgres-report-engine.driver";
export { ProductAnalyticsQueryInvalidError } from "#node/errors/product-analytics-query-invalid.error";
export { ProductAnalyticsScopeMissingError } from "#node/errors/product-analytics-scope-missing.error";
export { ProductAnalyticsUnavailableError } from "#node/errors/product-analytics-unavailable.error";
export { ReportRequestInvalidError } from "#node/errors/report-request-invalid.error";
export { registerReportSources } from "#node/functions/register-report-sources.function";
export { ReportsOptions } from "#node/schemas/reports-options.schema";
