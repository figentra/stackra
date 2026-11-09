/**
 * Stackra file contract:
 * Purpose: `RowIsolationMissingError`, the failure of a cross-tenant caller that claimed a tenant's row while no
 *          `CallIsolation` is bound: nothing could set that tenant, so the row would load as nothing and be skipped.
 * Boundary: raised before any tenant row is read or changed; a platform row (no tenant) needs no isolation. Kind
 *           `FailedPrecondition`, not retryable, code `row_isolation_missing`; the one detail is the claimed id or
 *           position.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decision 2: every background unit runs in `CallIsolation`); ADR 0239 (2026-11-07
 *                     amendment, gap A); ADR 0140 (envelope and kinds); ADR 0328.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A tenant's row was claimed with no isolation to load it in.
 *
 * @example
 * throw RowIsolationMissingError.create({ id: "evt_01jab3k4m5n6p7q8r9s0t1v2w3" });
 */
export class RowIsolationMissingError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The claimed id, or the change log position. */
  id!: string;
}
