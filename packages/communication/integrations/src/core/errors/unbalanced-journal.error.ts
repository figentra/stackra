/**
 * Stackra file contract:
 * Purpose: `UnbalancedJournalError` (`unbalanced_journal`), the refusal of a journal whose debits and credits differ in
 *          a currency, or that has fewer than two lines or a line that is not positive.
 * Boundary: kind `Validation`, never retryable. Raised before any provider call. Its details are the reference and
 *           the currency, never an account's balance.
 * Runtime: isomorphic
 * Governing contract: Juristra services-and-packages (balanced journals); ADR 0140; ADR 0328.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The journal does not balance.
 *
 * @example
 * throw UnbalancedJournalError.create({ reference: "inv_1", currency: "SAR" });
 */
export class UnbalancedJournalError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The journal's reference. */
  reference!: string;

  /** The currency that does not balance, when one is the cause. */
  currency?: string;
}
