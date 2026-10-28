/**
 * Stackra file contract:
 * Purpose: `AccountingJournalEntry`, a balanced journal to post: its date, a narration, our reference and its lines.
 * Boundary: a type only; `postJournal` refuses an unbalanced one before any provider call.
 * Runtime: isomorphic
 * Governing contract: Juristra services-and-packages (balanced, idempotent journals); ADR 0356 (decision 2);
 *                     STA-1383 (package-qualified: ledger owns JournalEntry and JournalLine).
 */
import type { AccountingJournalLine } from "#contracts/types/accounting-journal-line.type";

/** A journal ready to post. */
export interface AccountingJournalEntry {
  /** The accounting date. */
  readonly date: Date;

  /** What the journal records, shown in the provider. */
  readonly narration: string;

  /** Our record's reference (an invoice or a trust transfer id), kept on the provider's journal. */
  readonly reference: string;

  /** At least two lines whose debits equal their credits in every currency. */
  readonly lines: readonly AccountingJournalLine[];
}
