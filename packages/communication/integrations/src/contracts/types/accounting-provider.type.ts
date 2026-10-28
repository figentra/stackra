/**
 * Stackra file contract:
 * Purpose: `AccountingProvider`, what an accounting provider's Connection implements: post a balanced journal once per
 *          idempotency key, find the journal a key already posted, and read the chart of accounts for mapping.
 * Boundary: an interface a provider Connection implements (Xero, QuickBooks, Zoho Books, Odoo), not a container port:
 *           the tenant's Connection chooses the provider per call (ADR 0356 decision 2), resolved with
 *           `ProviderResolver`. Callers post through `postJournal`, which checks the balance and the key first.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decision 2); ADR 0355 (decision 1: the driver role); Juristra services-and-packages.
 */
import type { AccountingJournalEntry } from "#contracts/types/accounting-journal-entry.type";
import type { PostedJournal } from "#contracts/types/posted-journal.type";

/**
 * An accounting provider account.
 *
 * @example
 * export class XeroConnection extends Connection<XeroIntegration> implements AccountingProvider { … }
 */
export interface AccountingProvider {
  /**
   * Posts `entry` under `idempotencyKey`; a provider that deduplicates on the key returns the first journal.
   *
   * @returns the provider's journal.
   */
  post(entry: AccountingJournalEntry, idempotencyKey: string): Promise<PostedJournal>;

  /**
   * The journal posted under `idempotencyKey`, for a call whose answer was lost.
   *
   * @returns null when none was posted.
   */
  find(idempotencyKey: string): Promise<PostedJournal | null>;

  /** The tenant's accounts in the provider, for the mapping screen. */
  accounts(): Promise<readonly { readonly code: string; readonly name: string }[]>;
}
