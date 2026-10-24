/**
 * Stackra file contract:
 * Purpose: `JournalLine<M>`, one line of a balanced posting (`Journal#post`): a journal entry with the balance floor
 *          its account must keep.
 * Boundary: a type only. `floor` overrides the journal's default for this line's account; `null` lifts it, so a
 *           counter account (an issuing or clearing account) may go below zero while the party's account may not.
 * Runtime: node
 * Governing contract: ADR 0220 (decision 4: double entry, accounts per party and purpose).
 */
import type { JournalEntry } from "#core/types/journal-entry.type";

/**
 * A posting line.
 *
 * @example
 * await journal.post([
 *   { account: "issued", amount: -120, kind: EntryKind.Earn, reference: orderId, at, floor: null },
 *   { account: memberId, amount: 120, kind: EntryKind.Earn, reference: orderId, at },
 * ]);
 */
export interface JournalLine<M extends object = object> extends JournalEntry<M> {
  /** The lowest balance this line may leave its account at; `null` for none; the journal's default when absent. */
  readonly floor?: number | null;
}
