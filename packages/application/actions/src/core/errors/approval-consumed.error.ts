/**
 * Stackra file contract:
 * Purpose: `ApprovalConsumedError` (`approval_consumed`), the refusal when the request was already used: executed, failed or unknown, executing under another key, or an `on_grant` request resubmitted by its requester.
 * Boundary: Kind `Conflict` (409), not retryable. The executor reads it as "in flight" and never settles a request `failed` on it.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (refusals); ADR 0140 (envelope and kinds); STA-1724 FR-009.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The approval was already used.
 *
 * @example
 * throw ApprovalConsumedError.create();
 */
export class ApprovalConsumedError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: false,
}) {}
