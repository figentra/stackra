/**
 * Stackra file contract:
 * Purpose: `ApprovalPendingLimitError` (`approval_pending_limit`), the refusal when the requester has too many pending requests for this action; raised by the store's `park`.
 * Boundary: Kind `RateLimited` (429), not retryable until a request ends.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (refusals); ADR 0140 (envelope and kinds); STA-1724 FR-009.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The requester has too many pending requests for this action.
 *
 * @example
 * throw ApprovalPendingLimitError.create();
 */
export class ApprovalPendingLimitError extends Refusal({
  kind: ErrorKind.RateLimited,
  retryable: false,
}) {}
