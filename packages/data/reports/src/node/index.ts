/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/reports until `stackra gen` writes the entry barrels
 *          (STA-339): the Postgres report compiler (`PostgresReportRunnerDriver`), its configuration, the source
 *          registration generated wiring calls, and the request refusal.
 * Boundary: names each re-export and declares nothing. Node only: the driver reaches the database.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0470 (decision 3); the STA-347 stand-in barrel decision.
 */
export { ReportsConfig } from "#node/config/reports.config";
export { REPORTS_CONFIG_SCHEMA as ReportsConfig$ } from "#node/constants/reports-config-schema.constant";
export { PostgresReportRunnerDriver } from "#node/drivers/postgres-report-runner.driver";
export { ReportRequestInvalidError } from "#node/errors/report-request-invalid.error";
export { registerReportSources } from "#node/functions/register-report-sources.function";
export { ReportsOptions } from "#node/schemas/reports-options.schema";
