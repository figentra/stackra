/**
 * Stackra file contract:
 * Purpose: `SequenceNotReservableError`, the refusal of a block reservation on a sequence that declares `reserve:
 *          false`: its numbers are issued online only, in date order.
 * Boundary: a refusal (`failed_precondition`); `sequence` is the locked key. The device issues such documents online.
 * Runtime: node
 * Governing contract: ADR 0342 (decision 4); ADR 0140 (refusals); ADR 0328 (built with `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The sequence takes no reservations. */
export class SequenceNotReservableError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The sequence's locked key, such as `billing.invoice`. */
  sequence!: string;
}
