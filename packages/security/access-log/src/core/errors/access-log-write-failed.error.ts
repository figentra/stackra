/**
 * Stackra file contract:
 * Purpose: `AccessLogWriteFailedError`, the refusal a sink throws when it cannot store an access record: its store is
 *          down, or its chain head kept moving under concurrent writers.
 * Boundary: kind `Unavailable` (HTTP 503), retryable; code `access_log_write_failed`, the same code `AccessLogService`
 *           logs for the failure. It reaches the caller only for a class that fails closed (ADR 0409: the configured
 *           classes, or a privileged facet), so that read is not served unlogged; every other read is still served.
 *           It carries no details, so no record content or personal data travels with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0232; ADR 0328 (built with `create`); ADR 0212 (open question
 *                     1); ADR 0409.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Retryable: the record is still in hand, so a later write may succeed.
 *
 * @example
 * throw AccessLogWriteFailedError.create({}, { cause });
 */
export class AccessLogWriteFailedError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {}
