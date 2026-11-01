/**
 * Stackra file contract:
 * Purpose: `ApprovalNotGrantedError` (`approval_not_granted`), the refusal when the request is not granted: still pending, rejected or withdrawn, or granted by too few distinct people.
 * Boundary: Kind `FailedPrecondition` (412), not retryable as it is; a pending request may be granted later.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (refusals); ADR 0140 (envelope and kinds); STA-1724 FR-009.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The approval is not granted.
 *
 * @example
 * throw ApprovalNotGrantedError.create();
 */
export class ApprovalNotGrantedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {}
