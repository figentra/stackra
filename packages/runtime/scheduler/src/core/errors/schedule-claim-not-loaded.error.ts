/**
 * Stackra file contract:
 * Purpose: `ScheduleClaimNotLoadedError`, the failure of the tick whose claimed schedule did not load in its claimed
 *          owner's isolation: the schedule was deleted since the claim, or the isolation set another owner than the
 *          claim named.
 * Boundary: raised, never swallowed: a claimed schedule's due runs are never skipped (ADR 0239 amendment, gap A). Kind
 *           `Internal`, not retryable, code `schedule_claim_not_loaded`; the one detail is the claimed id, never the
 *           input.
 * Runtime: isomorphic
 * Governing contract: ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0140 (envelope and kinds); ADR 0328.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A claimed schedule did not load in its owner's isolation.
 *
 * @example
 * throw ScheduleClaimNotLoadedError.create({ id: "sch_01jab3k4m5n6p7q8r9s0t1v2w3" });
 */
export class ScheduleClaimNotLoadedError extends Refusal({
  kind: ErrorKind.Internal,
  retryable: false,
}) {
  /** The claimed schedule id. */
  id!: string;
}
