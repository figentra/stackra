/**
 * Stackra file contract:
 * Purpose: `UnbalancedPostingError`, the refusal of a posting whose lines do not sum to zero, or that has fewer than two
 *          lines (double entry means every movement leaves one account and reaches another), or whose lines are in more
 *          than one currency (a posting is in one ISO 4217 currency, ADR 0220).
 * Boundary: a refusal (`failed_precondition`); nothing was written. `total` is the lines' sum, `lines` their count, `currencies` the distinct
 *           currencies of a mixed-currency posting.
 * Runtime: node
 * Governing contract: ADR 0220 (decision 4: double entry); ADR 0140 (refusals); ADR 0328 (`create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The posting does not balance or mixes currencies. */
export class UnbalancedPostingError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** How many lines the posting had. */
  lines!: number;

  /** The sum of the lines' amounts; a balanced posting sums to zero. */
  total!: number;

  /** The distinct currencies of the lines, set when the posting mixes currencies. */
  currencies?: readonly string[];
}
