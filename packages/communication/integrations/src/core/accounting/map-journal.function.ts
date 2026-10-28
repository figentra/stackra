/**
 * Stackra file contract:
 * Purpose: `mapJournal(entry, map)`, a journal written in our account and tax keys turned into the provider's codes
 *          through the Connection's `AccountMap`.
 * Boundary: pure. Every line must map: the first unmapped key is refused, never passed through as a code, so a
 *           half-mapped chart cannot post to a wrong account. Amounts, sides, the date and the reference are kept.
 * Runtime: isomorphic
 * Governing contract: ADR 0356 (decision 2); STA-794 (account mapping per Connection).
 */
import type { AccountMap } from "#contracts/accounting/account-map.type";
import type { AccountingJournalEntry } from "#contracts/types/accounting-journal-entry.type";
import type { AccountingJournalLine } from "#contracts/types/accounting-journal-line.type";
import { UnmappedAccountError } from "#core/accounting/unmapped-account.error";

/**
 * The provider's journal for `entry`.
 *
 * @throws UnmappedAccountError naming the first account or tax key `map` lacks.
 * @example
 * const posted = await postJournal(accounting, mapJournal(entry, await accounting.accountMap()), key);
 */
export function mapJournal(entry: AccountingJournalEntry, map: AccountMap): AccountingJournalEntry {
  const lines = entry.lines.map((line): AccountingJournalLine => {
    const account = Object.hasOwn(map.accounts, line.account)
      ? map.accounts[line.account]
      : undefined;
    if (account === undefined)
      throw UnmappedAccountError.create({ reference: entry.reference, account: line.account });
    if (line.taxCode === undefined) return { ...line, account };
    const taxCodes = map.taxCodes ?? {};
    const taxCode = Object.hasOwn(taxCodes, line.taxCode) ? taxCodes[line.taxCode] : undefined;
    if (taxCode === undefined)
      throw UnmappedAccountError.create({ reference: entry.reference, taxCode: line.taxCode });
    return { ...line, account, taxCode };
  });
  return { ...entry, lines };
}
