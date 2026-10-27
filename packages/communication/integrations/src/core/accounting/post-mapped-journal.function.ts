/**
 * Stackra file contract:
 * Purpose: `postMappedJournal(provider, entry, idempotencyKey)`, the way a source journal in our account keys reaches
 *          the tenant's accounting provider: mapped through that Connection's `AccountMap`, then posted once by
 *          `postJournal` (balance checked, a key already posted returns its journal).
 * Boundary: the provider is the Connection `ProviderResolver` or `ConnectorGateway` chose. Nothing is posted when the
 *           map lacks a key or the journal does not balance.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decision 2); Juristra services-and-packages (balanced, idempotent journals); STA-794.
 */
import type { AccountMapped } from "#contracts/accounting/account-mapped.type";
import type { AccountingProvider } from "#contracts/types/accounting-provider.type";
import type { JournalEntry } from "#contracts/types/journal-entry.type";
import type { PostedJournal } from "#contracts/types/posted-journal.type";
import { mapJournal } from "#core/accounting/map-journal.function";
import { postJournal } from "#core/functions/post-journal.function";

/**
 * Maps and posts `entry` once.
 *
 * @throws UnbalancedJournalError or UnmappedAccountError before any provider call.
 * @example
 * const journal = await postMappedJournal(accounting, entry, `invoice.issued:${event.id}`);
 */
export async function postMappedJournal(
  provider: AccountingProvider & AccountMapped,
  entry: JournalEntry,
  idempotencyKey: string,
): Promise<PostedJournal> {
  return postJournal(provider, mapJournal(entry, await provider.accountMap()), idempotencyKey);
}
