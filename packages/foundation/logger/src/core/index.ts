/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/logger, its only entry, until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The shipped schemas are re-exported under the generated names
 *           (`LoggingConfig$`, `TelemetryConfig$`) a host's generated schemas extend. The redaction lists stay internal.
 *           `Logger` itself is @stackra/contracts'; this package ships its driver.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { LoggingConfig } from "#config/logging.config";
export { TelemetryConfig } from "#config/telemetry.config";
export { LOGGING_CONFIG_SCHEMA as LoggingConfig$ } from "#core/constants/logging-config-schema.constant";
export { TELEMETRY_CONFIG_SCHEMA as TelemetryConfig$ } from "#core/constants/telemetry-config-schema.constant";
export { ChannelLoggerDriver } from "#core/drivers/channel-logger.driver";
export { ConsoleLogReporterDriver } from "#core/drivers/console-log-reporter.driver";
export { LogLevel } from "#core/enums/log-level.enum";
export { redact } from "#core/functions/redact.function";
export { LogReporter } from "#core/ports/log-reporter.port";
export { LoggingOptions } from "#core/schemas/logging-options.schema";
export { TelemetryOptions } from "#core/schemas/telemetry-options.schema";
export type { LogRecord } from "#core/types/log-record.type";
