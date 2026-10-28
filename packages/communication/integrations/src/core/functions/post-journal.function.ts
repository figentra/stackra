/**
 * Stackra file contract:
 * Purpose: `postJournal(provider, entry, idempotencyKey)`, the one way a journal reaches an accounting provider:
 *          checked for balance, then posted at most once per key, a lost answer recovered by finding the journal the
 *          key already posted.
 * Boundary: the provider is the Connection `ProviderResolver` chose. The key is the caller's (the source record's
 *           event id), so a retried job posts nothing new.
 * Runtime: isomorphic
 * Governing contract: Juristra services-and-packages (balanced, idempotent journals); ADR 0356 (decision 2).
 */
import type { AccountingProvider } from "#contracts/types/accounting-provider.type";
import type { AccountingJournalEntry } from "#contracts/types/accounting-journal-entry.type";
import type { PostedJournal } from "#contracts/types/posted-journal.type";
import { assertBalanced } from "#core/functions/assert-balanced.function";

/**
 * Posts `entry` once.
 *
 * @throws UnbalancedJournalError before any provider call when `entry` does not balance.
 * @example
 * const journal = await postJournal(accounting, entry, `invoice.issued:${event.id}`);
 */
export async function postJournal(
  provider: AccountingProvider,
  entry: AccountingJournalEntry,
  idempotencyKey: string,
): Promise<PostedJournal> {
  assertBalanced(entry);
  return (await provider.find(idempotencyKey)) ?? provider.post(entry, idempotencyKey);
}
