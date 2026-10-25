/**
 * Stackra file contract:
 * Purpose: `JournalEntry<M>`, one movement on one account as the journal speaks of it: the account, the signed integer
 *          amount, why it exists, the reference that makes it idempotent and when its cause happened. It is not the
 *          persisted row: `Journal<M>` maps these names onto the model's fields through `@Journaled`.
 * Boundary: a type only. `kind` is the model's own `kind` type when it has one (an `Enum.of` code), else a string.
 *           Amounts are whole units (points or minor units), never a float (ADR 0220).
 * Runtime: node
 * Governing contract: ADR 0220 (decisions 4 and 5: entries, reversals, the idempotency key in the entry).
 */

/**
 * One journal movement.
 *
 * @example
 * const earn: JournalEntry<LedgerEntry> = { account: memberId, amount: 120, kind: EntryKind.Earn, reference: orderId, at };
 */
export interface JournalEntry<M extends object = object> {
  /** The account the amount moves on: a party and purpose key such as a member's public id. */
  readonly account: string;

  /** The signed amount in whole units: positive raises the balance, negative lowers it; a safe integer. */
  readonly amount: number;

  /** Why the entry exists; the model's `kind` type when it declares one. */
  readonly kind: M extends { readonly kind: infer K extends string } ? K : string;

  /** The cause (an order id, a campaign id); one entry per (account, reference) is the idempotency rule. */
  readonly reference: string;

  /** When the cause happened, from the caller's clock, not when the row was written. */
  readonly at: Date;
}
