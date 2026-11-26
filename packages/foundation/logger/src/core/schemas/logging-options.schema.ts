/**
 * Stackra file contract:
 * Purpose: `LoggingOptions`, the shape of `LoggingConfig`: the lowest level written, per-channel levels, the share of
 *          debug and info lines kept, and the field names a host redacts besides the built-in list.
 * Boundary: a shape class; it registers this package's own schema (`LOGGING_CONFIG_SCHEMA`) for itself when the module
 *           loads, so `buildConfig(LoggingConfig)` validates with no generated file. `redaction` is a nested object a
 *           host override replaces whole, merging the base value explicitly.
 * Runtime: isomorphic
 * Governing contract: ADR 0147 (decision 1: per-module levels, sampling, redaction); ADR 0294 (decisions 19 and 26);
 *                     ADR 0305 (rule 34).
 */
import "#core/types/log-reporter-driver-names.type";

import type { DriverName } from "@stackra/container";
import { Field, Num, registerSchemas, Schema } from "@stackra/validation";

import { LOGGING_CONFIG_SCHEMA } from "#core/constants/logging-config-schema.constant";
import { LogLevel } from "#contracts/enums/log-level.enum";
import type { LogReporter } from "#contracts/ports/log-reporter.port";

/**
 * The logger's settings.
 *
 * @example
 * export class LoggingConfig extends BaseLoggingConfig {
 *   override redaction = { ...new BaseLoggingConfig().redaction, extraFields: ["customerId", "paymentId"] };
 * }
 */
export class LoggingOptions extends Schema {
  /** The share of debug and info lines kept, 0 to 1; warnings and errors are always kept. */
  @Num({
    min: 0,
    max: 1,
  })
  sampleRate = 1;

  /** What is masked besides the built-in credential and personal-data names. */
  // reason: a nested object a host override replaces whole; the shipped schema already states its rule
  @Field(LOGGING_CONFIG_SCHEMA.shape.redaction)
  redaction: {
    /** Field names masked wherever they appear (`customerId` also matches `customer_id`, `stripeCustomerId`). */
    extraFields: string[];
  } = { extraFields: [] };

  /** Which reporter writes the lines: `console` (stdout, the platform collects it) or `otlp` (`OtlpConfig`). */
  reporter: DriverName<LogReporter> = "console";

  /** The lowest level written for a channel with no level of its own. */
  level: LogLevel = LogLevel.Info;

  /** Channel (the event's module key, `orders`) to the lowest level written for it. */
  channels: Record<string, LogLevel> = {};
}

registerSchemas([[LoggingOptions, LOGGING_CONFIG_SCHEMA]]);
