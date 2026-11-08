/**
 * Stackra file contract:
 * Purpose: `ClaimNotLoadedError`, the failure of a cross-tenant caller (the relay, the cross-app relay, the change
 *          feed's readers, the operator's commands) whose claimed row did not load in its claimed tenant's isolation:
 *          the row moved, or the isolation set another tenant than the claim named.
 * Boundary: raised, never swallowed: a claimed row is never skipped, since a skip would look like a delivery and move a
 *           cursor past a change no consumer saw (ADR 0239 amendment, gap A). Kind `Internal`, not retryable, code
 *           `claim_not_loaded`; the one detail is the claimed id or position, never a payload.
 * Runtime: isomorphic
 * Governing contract: ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0140 (envelope and kinds); ADR 0328.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A claimed row did not load in its tenant's isolation.
 *
 * @example
 * throw ClaimNotLoadedError.create({ id: "evt_01jab3k4m5n6p7q8r9s0t1v2w3" });
 */
export class ClaimNotLoadedError extends Refusal({
  kind: ErrorKind.Internal,
  retryable: false,
}) {
  /** The claimed id, or the change log position. */
  id!: string;
}
