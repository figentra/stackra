/**
 * Stackra file contract:
 * Purpose: `assertBalanced(entry)`, the check every journal passes before it reaches an accounting provider: at least
 *          two lines, every amount positive, and debits equal to credits in each currency.
 * Boundary: pure; integer minor units only, so no float rounding can hide a difference.
 * Runtime: isomorphic
 * Governing contract: Juristra services-and-packages (balanced journals); ADR 0356 (decision 2).
 */
import type { JournalEntry } from "#contracts/types/journal-entry.type";
import { UnbalancedJournalError } from "#core/errors/unbalanced-journal.error";

/**
 * Throws unless `entry` balances.
 *
 * @throws UnbalancedJournalError naming the first currency that does not balance.
 * @example
 * assertBalanced({ date, narration, reference: "inv_1", lines: [debit, credit] });
 */
export function assertBalanced(entry: JournalEntry): void {
  if (entry.lines.length < 2 || entry.lines.some((line) => line.amount.minor <= 0))
    throw UnbalancedJournalError.create({ reference: entry.reference });
  const totals = new Map<string, number>();
  for (const line of entry.lines) {
    const signed = line.side === "debit" ? line.amount.minor : -line.amount.minor;
    totals.set(line.amount.currency, (totals.get(line.amount.currency) ?? 0) + signed);
  }
  for (const [currency, total] of totals)
    if (total !== 0) throw UnbalancedJournalError.create({ reference: entry.reference, currency });
}
