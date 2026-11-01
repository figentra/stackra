/**
 * Stackra file contract:
 * Purpose: `ApproverRefusedError` (`approver_refused`), the memory gate's refusal of a vote, carrying the
 *          `ApproverRefusal` code (`self_approval`, `already_approved`, `approver_not_permitted`, `step_up_required`,
 *          `seat_kind`) in `refusal`.
 * Boundary: test only. The OS store raises the approver-side refusals itself; this stands in for it.
 * Runtime: node
 * Governing contract: ADR 0509 (FR-009: approver-side refusals stay ApproverRefusal codes); STA-1724 FR-010.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** A vote the store refused. */
export class ApproverRefusedError extends Refusal({
  kind: ErrorKind.Forbidden,
  retryable: false,
}) {
  /** The `ApproverRefusal` code. */
  refusal!: string;
}
