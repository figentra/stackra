/**
 * Stackra file contract:
 * Purpose: the `LogReporter` port: where a log line goes once the logger has filtered and redacted it (stdout today;
 *          an OTLP or Better Stack driver later, ADR 0147).
 * Boundary: an abstract class that is its own token. A reporter receives redacted records only and must not throw
 *           for a bad record; the logger still catches a throw so a caller never fails because of logging. Lives in
 *           `core/ports/` because this package has no `./contracts` entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0147 (decision 1: drivers); ADR 0294 (decisions 16 and 17); ADR 0263 (ports resolve by
 *                     type).
 */
import { Port } from "@stackra/contracts";

import type { LogRecord } from "#core/types/log-record.type";

/** Writes redacted log records somewhere. */
export abstract class LogReporter extends Port {
  /** Hands one record to the destination; synchronous, so a line written just before a crash is not lost. */
  abstract report(record: LogRecord): void;
}
