/**
 * Stackra file contract:
 * Purpose: the Logger port: structured logs as a named event plus fields, written by services and drivers.
 * Boundary: an abstract class that is its own token; `@stackra/logger` ships the drivers. The event is a snake_case
 *           constant (`orders.draft_priced`), never prose; fields carry no secret and no unclassified personal data.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17), ADR 0184 (telemetry and logs), ADR 0231 (snake_case codes).
 */
import { Port } from "#core/bases/port.base";

/**
 * Writes one structured log line per call.
 *
 * @example
 * this.logger.error(ACCESS_LOG_WRITE_FAILED, { callId, target, cause });
 */
export abstract class Logger extends Port {
  /** Detail for a developer; dropped in production by default. */
  abstract debug(event: string, fields?: Readonly<Record<string, unknown>>): void;

  /** Something worth knowing happened. */
  abstract info(event: string, fields?: Readonly<Record<string, unknown>>): void;

  /** Something unexpected happened and was handled. */
  abstract warn(event: string, fields?: Readonly<Record<string, unknown>>): void;

  /** Something failed; put the caught error in `fields.cause`. */
  abstract error(event: string, fields?: Readonly<Record<string, unknown>>): void;
}
