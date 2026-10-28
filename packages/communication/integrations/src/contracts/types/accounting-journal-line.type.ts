/**
 * Stackra file contract:
 * Purpose: `AccountingJournalLine`, one line of a journal posted to an accounting provider: the provider's account code, the
 *          side, a positive amount and an optional description and tax code.
 * Boundary: a type only. The account and tax codes are the tenant's chart in the provider, mapped by the tenant's
 *           settings, never by code here.
 * Runtime: isomorphic
 * Governing contract: Juristra services-and-packages (accounting provider contract); ADR 0356 (decision 2);
 *                     STA-1383 (package-qualified: ledger owns JournalEntry and JournalLine).
 */
import type { Money } from "@stackra/money";

/** A debit or a credit. */
export interface AccountingJournalLine {
  /** The account's code in the provider's chart. */
  readonly account: string;

  /** Which side the amount is on. */
  readonly side: "debit" | "credit";

  /** The amount, positive. */
  readonly amount: Money;

  /** What the line is for, shown in the provider. */
  readonly description?: string;

  /** The provider's tax code, when the line carries tax. */
  readonly taxCode?: string;
}
