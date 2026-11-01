/**
 * Stackra file contract:
 * Purpose: `ApprovalMismatchError` (`approval_mismatch`), the refusal when the approval id does not belong to this call: another tenant, scope, requester, action or input than the binding records, or a store row that differs from the binding (B1).
 * Boundary: Kind `Forbidden` (403), not retryable: the same id never fits this call. It names no field of the binding.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (refusals); ADR 0140 (envelope and kinds); STA-1724 FR-009.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The approval does not match the call.
 *
 * @example
 * throw ApprovalMismatchError.create();
 */
export class ApprovalMismatchError extends Refusal({
  kind: ErrorKind.Forbidden,
  retryable: false,
}) {}
