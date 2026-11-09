/**
 * Stackra file contract:
 * Purpose: `ScheduleRowIsolationMissingError`, the failure of the tick that claimed an owned schedule while no
 *          `CallIsolation` is bound: nothing could set that owner, so the schedule would load as nothing and its runs
 *          would be skipped.
 * Boundary: raised before any owned row is read or a run pushed; a platform schedule (no owner) needs no isolation.
 *           Kind `FailedPrecondition`, not retryable, code `schedule_row_isolation_missing`; the one detail is the
 *           claimed id.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decision 2: every background unit runs in `CallIsolation`); ADR 0239 (2026-11-07
 *                     amendment, gap A); ADR 0140 (envelope and kinds); ADR 0328.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * An owned schedule was claimed with no isolation to load it in.
 *
 * @example
 * throw ScheduleRowIsolationMissingError.create({ id: "sch_01jab3k4m5n6p7q8r9s0t1v2w3" });
 */
export class ScheduleRowIsolationMissingError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The claimed schedule id. */
  id!: string;
}
