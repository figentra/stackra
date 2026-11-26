/**
 * Stackra file contract:
 * Purpose: `JobClaimNotLoadedError`, the failure of a cross-owner caller (the worker after a reservation, the operator's
 *          dead-letter commands) whose claimed job did not load in its claimed owner's isolation: the job moved, or the
 *          isolation set another owner than the claim named.
 * Boundary: raised, never swallowed: a claimed job is never skipped (ADR 0239 amendment, gap A). Kind `Internal`, not
 *           retryable, code `job_claim_not_loaded`; the one detail is the claimed id, never the input.
 * Runtime: isomorphic
 * Governing contract: ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0140 (envelope and kinds); ADR 0328.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A claimed job did not load in its owner's isolation.
 *
 * @example
 * throw JobClaimNotLoadedError.create({ id: "job_01jab3k4m5n6p7q8r9s0t1v2w3" });
 */
export class JobClaimNotLoadedError extends Refusal({
  kind: ErrorKind.Internal,
  retryable: false,
}) {
  /** The claimed job id. */
  id!: string;
}
