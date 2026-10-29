/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/logger`
 *          (`LoggingConfig`, `LoggingConfig$`, `TelemetryConfig`, `TelemetryConfig$`) and the registry row's channels,
 *          reporters, OTLP tracer and metrics drivers, traceparent helpers and redaction are exported, nothing else is (the redaction lists stay internal), the `$` names
 *          are the shipped schemas, and the public type resolves.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { LOGGING_CONFIG_SCHEMA } from "#core/constants/logging-config-schema.constant";
import { TELEMETRY_CONFIG_SCHEMA } from "#core/constants/telemetry-config-schema.constant";
import type { LogLevel, LogRecord } from "#contracts/index";
import * as logger from "#core/index";

describe("@stackra/logger", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(logger).sort()).toEqual([
      "ChannelLoggerDriver",
      "ConsoleLogReporterDriver",
      "LoggingConfig",
      "LoggingConfig$",
      "LoggingOptions",
      "OtlpConfig",
      "OtlpConfig$",
      "OtlpLogReporterDriver",
      "OtlpMetricsDriver",
      "OtlpOptions",
      "OtlpTracerDriver",
      "TelemetryConfig",
      "TelemetryConfig$",
      "TelemetryOptions",
      "formatTraceparent",
      "parseTraceparent",
      "redact",
    ]);
  });

  it("exports the shipped schemas under their generated names", () => {
    expect(logger.LoggingConfig$).toBe(LOGGING_CONFIG_SCHEMA);
    expect(logger.TelemetryConfig$).toBe(TELEMETRY_CONFIG_SCHEMA);
  });

  it("leaves the reporter port to the contracts entry", () => {
    expect("LogReporter" in logger).toBe(false);
    expect("LogLevel" in logger).toBe(false);
  });

  it("resolves its public types", () => {
    expectTypeOf<LogRecord["level"]>().toEqualTypeOf<LogLevel>();
    expectTypeOf<LogRecord["fields"]>().toEqualTypeOf<Readonly<Record<string, unknown>>>();
  });
});
