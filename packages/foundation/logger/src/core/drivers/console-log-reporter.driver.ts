/**
 * Stackra file contract:
 * Purpose: the console driver of the `LogReporter` port: one JSON line per record on the matching `console` method,
 *          which a server's stdout collector (Encore, a container runtime) and a browser's devtools both read.
 * Boundary: writes only what it receives, already redacted; no buffering, no network.
 * Runtime: isomorphic
 * Governing contract: ADR 0147 (decision 1: structured JSON, console driver); ADR 0266 (one default driver).
 */
import { Driver } from "@stackra/container";

import { LogReporter } from "#contracts/ports/log-reporter.port";
import type { LogRecord } from "#contracts/types/log-record.type";

/** Writes each record as one JSON line to the console. */
export class ConsoleLogReporterDriver extends Driver(LogReporter) {
  /** Writes `record` with the `console` method named by its level. */
  report(record: LogRecord): void {
    // The LogLevel codes are the console method names.
    console[record.level](JSON.stringify(record));
  }
}
