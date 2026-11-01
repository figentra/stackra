/**
 * Stackra file contract:
 * Purpose: `ApprovalStatus`, where an approval request is: `pending`, then `granted`, `rejected`, `withdrawn` or
 *          `expired`; a granted one becomes `executing` by compare-and-set before the pipeline runs, then `executed`,
 *          `failed` or `unknown`.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry; snake_case machine codes (ADR 0231).
 *           The table of moves (FR-021) is held by the store driver and its conformance suite, never by a caller:
 *           reject and withdraw act only on `pending`, and every state but `pending`, `granted` and `executing` is
 *           final.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (the store's states); STA-1724 FR-021; ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/**
 * The states of an approval request.
 *
 * @example
 * if (record.status === ApprovalStatus.Granted) await gate.begin(record.approvalId, key);
 */
export const ApprovalStatus = Enum.of({
  /** Waiting for votes. */
  Pending: "pending",
  /** Enough distinct approvers voted; the call may run. */
  Granted: "granted",
  /** The call is running under its execution key. */
  Executing: "executing",
  /** The call ran. */
  Executed: "executed",
  /** The execution was refused; a new request is needed. */
  Failed: "failed",
  /** An approver rejected it. */
  Rejected: "rejected",
  /** The requester withdrew it. */
  Withdrawn: "withdrawn",
  /** Its window passed before it was granted. */
  Expired: "expired",
  /** It stayed `executing` past the execution window; operators decide, nothing retries it. */
  Unknown: "unknown",
});

/** One of the codes above. */
export type ApprovalStatus = Enum.Value<typeof ApprovalStatus>;
