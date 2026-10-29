/**
 * Stackra file contract:
 * Purpose: `AuditExportFailedError`, the refusal an `AuditExportSink` driver throws when its receiver does not accept a
 *          batch: the endpoint is unset, not HTTPS, unreachable, or answers other than 2xx.
 * Boundary: kind `Unavailable` (HTTP 503), retryable: the export job runs again and re-sends from the start. It carries
 *           no details: the cause names the receiver's HTTP status, never a record or the endpoint's token.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0328 (built with `create`); STA-1579.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Retryable: the batch is still in the table, so a later run sends it again.
 *
 * @example
 * throw AuditExportFailedError.create({}, { cause: new Error(`HTTP ${response.status}`) });
 */
export class AuditExportFailedError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {}
