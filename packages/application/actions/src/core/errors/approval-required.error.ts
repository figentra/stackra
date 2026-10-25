/**
 * Stackra file contract:
 * Purpose: `ApprovalRequiredError` (`approval_required`), the refusal of an action call that needs an approval: the
 *          gate parked a request, and the caller resubmits the same call with `approvalId` once it is granted.
 * Boundary: raised by the `ApprovalGate` driver in the approval step. Kind `FailedPrecondition` (412), not retryable as
 *           it is: the same call succeeds only with the granted approval's id. The one detail is that id, so a client
 *           can show the request and resume; nothing of the input travels with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0098 (decision 3: approval, durable park and resume); ADR 0140 (envelope and kinds); ADR
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
}
