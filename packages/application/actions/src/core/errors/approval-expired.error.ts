/**
 * Stackra file contract:
 * Purpose: `ApprovalExpiredError` (`approval_expired`), the refusal when the approval's window passed: its `expiresAt`, or 24 hours after its grant, by the owning service's clock.
 * Boundary: Kind `FailedPrecondition` (412), not retryable: a new request is needed. Checked at every read, never waiting for the sweep.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (refusals); ADR 0140 (envelope and kinds); STA-1724 FR-009.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The approval's window passed.
 *
 * @example
 * throw ApprovalExpiredError.create();
 */
export class ApprovalExpiredError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {}
