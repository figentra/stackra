/**
 * Stackra file contract:
 * Purpose: the channel driver of the `Logger` port from @stackra/contracts, the one every service and package logs
 *          through: it derives the channel from the event's module key, applies that channel's level and the sample
 *          rate, redacts the fields and hands one `LogRecord` to the `LogReporter`.
 * Boundary: a log call never throws and never fails its caller: a reporter that throws is reported on
 *           `console.error` with its class and error name only, never the record. Fields are redacted before any
 *           reporter sees them. Warnings and errors are never sampled away.
 * Runtime: isomorphic
 * Governing contract: ADR 0147 (decision 1: structured output, per-module levels, redaction, sampling); ADR 0294
 *                     (decisions 16 and 17); ADR 0184 (decision 5: no personal data in logs).
 */
import { Driver } from "@stackra/container";
import { Clock, Enum, Logger } from "@stackra/contracts";

import { LoggingConfig } from "#config/logging.config";
import { LogLevel } from "#core/enums/log-level.enum";
import { redact } from "#core/functions/redact.function";
import { LogReporter } from "#core/ports/log-reporter.port";
import type { LogRecord } from "#core/types/log-record.type";

/** The levels in severity order: a level's index is its rank. */
const LEVELS: readonly LogLevel[] = Enum.values(LogLevel);

/**
 * Writes structured, redacted log lines, filtered per channel.
 *
 * @example
 * this.logger.info("orders.draft_priced", { orderId, lines: 3 }); // channel "orders"
 */
export class ChannelLoggerDriver extends Driver(Logger) {
  private readonly config: LoggingConfig;

  private readonly reporter: LogReporter;

  private readonly clock: Clock;

  /**
   * @param config - the levels, channels, sample rate and extra redacted fields.
   * @param reporter - where records go; the console driver unless a host binds another.
   * @param clock - the time source of `LogRecord.time`.
   */
  constructor(config: LoggingConfig, reporter: LogReporter, clock: Clock) {
    super();
    this.config = config;
    this.reporter = reporter;
    this.clock = clock;
  }

  /** Detail for a developer; dropped unless the channel's level is `debug`. */
  debug(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.write(LogLevel.Debug, event, fields);
  }

  /** Something worth knowing happened. */
  info(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.write(LogLevel.Info, event, fields);
  }

  /** Something unexpected happened and was handled. */
  warn(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.write(LogLevel.Warn, event, fields);
  }

  /** Something failed; the caught error belongs in `fields.cause`. */
  error(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.write(LogLevel.Error, event, fields);
  }

  /** Filters, redacts and reports one line. */
  private write(
    level: LogLevel,
    event: string,
    fields: Readonly<Record<string, unknown>> = {},
  ): void {
    const { channels, sampleRate, redaction } = this.config;
    const channel = event.split(".", 1)[0] ?? event;
    // hasOwn: a channel named like an Object.prototype member (`constructor`) must not read the prototype.
    const threshold =
      (Object.hasOwn(channels, channel) ? channels[channel] : undefined) ?? this.config.level;
    if (LEVELS.indexOf(level) < LEVELS.indexOf(threshold)) return;
    const sampled = level === LogLevel.Debug || level === LogLevel.Info;
    if (sampled && Math.random() >= sampleRate) return;
    const record: LogRecord = {
      time: this.clock.now().toISOString(),
      level,
      event,
      channel,
      fields: redact(fields, redaction.extraFields) as Readonly<Record<string, unknown>>,
    };
    try {
      this.reporter.report(record);
    } catch (error) {
      console.error(
        JSON.stringify({
          time: record.time,
          level: LogLevel.Error,
          event: "logger.reporter_failed",
          channel: "logger",
          fields: {
            reporter: this.reporter.constructor.name,
            error: error instanceof Error ? error.name : typeof error,
          },
        }),
      );
    }
  }
}
