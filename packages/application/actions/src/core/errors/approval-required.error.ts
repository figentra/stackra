/**
 * Stackra file contract:
 * Purpose: `ApprovalRequiredError` (`approval_required`), the refusal of an action call that needs an approval: the
 *          gate parked a request, and the caller resubmits the same call with `approvalId` once it is granted.
 * Boundary: raised by the pipeline in the approval step, after it parked the request. Kind `FailedPrecondition` (412), not retryable as
 *           it is: the same call succeeds only with the granted approval's id. The details are that id and, for a declared stage,
 *           the approvals needed and the expiry, so a client can show "sent for approval"; nothing of the input travels
 *           with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (`approvalsRequired`, `expiresAt`; L-02); ADR 0098 (decision 3: approval, durable park and resume); ADR 0140 (envelope and kinds); ADR
 *                     0137 (refusal codes; this code needs its amendment, see the STA-348 ext-runtime spec).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The call waits for an approval.
 *
 * @example
 * throw ApprovalRequiredError.create({ approvalId: "apr_01j9z3k4m5n6p7q8r9s0t1v2w3" });
 */
export class ApprovalRequiredError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The parked approval request; resubmit the call with it once granted. */
  approvalId!: string;

  /** The distinct approvers the request needs, besides the requester. */
  approvalsRequired?: number;

  /** When the request expires, an ISO 8601 instant. */
  expiresAt?: string;
}
