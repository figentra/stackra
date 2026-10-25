/**
 * Stackra file contract:
 * Purpose: `LogRecord`, one structured log line as a reporter receives it: when, how severe, the event, the channel
 *          derived from the event and the redacted fields.
 * Boundary: a type only. `fields` has already passed redaction, so a reporter writes it as it is and never sees a
 *           masked value.
 * Runtime: isomorphic
 * Governing contract: ADR 0147 (decision 1: structured JSON); ADR 0184 (logs carry no personal data).
 */
import type { LogLevel } from "#contracts/enums/log-level.enum";

/** One log line. */
export interface LogRecord {
  /** The instant, ISO 8601 in UTC, read from the `Clock` port. */
  readonly time: string;

  /** The severity of the line. */
  readonly level: LogLevel;

  /** The snake_case event constant (`orders.draft_priced`). */
  readonly event: string;

  /** The event's first segment (`orders`): the module key whose level applies. */
  readonly channel: string;

  /** The caller's fields after redaction. */
  readonly fields: Readonly<Record<string, unknown>>;
}
