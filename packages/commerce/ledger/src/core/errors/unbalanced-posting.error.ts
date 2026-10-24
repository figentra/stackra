/**
 * Stackra file contract:
 * Purpose: `UnbalancedPostingError`, the refusal of a posting whose lines do not sum to zero, or that has fewer than two
 *          lines: double entry means every movement leaves one account and reaches another.
 * Boundary: a refusal (`failed_precondition`); nothing was written. `total` is the lines' sum, `lines` their count.
 * Runtime: node
 * Governing contract: ADR 0220 (decision 4: double entry); ADR 0140 (refusals); ADR 0328 (`create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The posting does not balance. */
export class UnbalancedPostingError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** How many lines the posting had. */
  lines!: number;

  /** The sum of the lines' amounts; a balanced posting sums to zero. */
  total!: number;
}
