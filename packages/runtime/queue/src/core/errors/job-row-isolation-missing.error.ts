/**
 * Stackra file contract:
 * Purpose: `JobRowIsolationMissingError`, the failure of a cross-owner caller that claimed an owned job while no
 *          `CallIsolation` is bound: nothing could set that owner, so the job would load as nothing and be skipped.
 * Boundary: raised before any owned row is read or changed; a platform job (no owner) needs no isolation. Kind
 *           `FailedPrecondition`, not retryable, code `job_row_isolation_missing`; the one detail is the claimed id.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decision 2: every background unit runs in `CallIsolation`); ADR 0239 (2026-11-07
 *                     amendment, gap A); ADR 0140 (envelope and kinds); ADR 0328.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * An owned job was claimed with no isolation to load it in.
 *
 * @example
 * throw JobRowIsolationMissingError.create({ id: "job_01jab3k4m5n6p7q8r9s0t1v2w3" });
 */
export class JobRowIsolationMissingError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The claimed job id. */
  id!: string;
}
