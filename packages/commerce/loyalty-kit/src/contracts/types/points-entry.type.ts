/**
 * Stackra file contract:
 * Purpose: `PointsEntry`, one movement on a member's points balance, as the ledger port receives it (not the persisted
 *          row).
 * Boundary: a type in the leaf entry; the row with its scope column and ids is `LedgerEntry` in ./node.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 8 and 15); ADR 0220 (integer units, idempotency in the entry).
 */
import type { EntryKind } from "#contracts/enums/entry-kind.enum";
import type { MemberId } from "#contracts/types/member-id.type";

/**
 * An append-only ledger movement; a balance is the sum of a member's entries.
 *
 * @example
 * await ledger.append({ memberId, points: 120, kind: EntryKind.Earn, reference: orderId, at });
 */
export interface PointsEntry {
  /** Whose points move. */
  readonly memberId: MemberId;

  /**
   * Points moved: positive for `Earn` and a positive `Adjust`, negative for `Redeem`, `Expire`, `Hold` and a negative
   * `Adjust`. Whole points.
   */
  readonly points: number;

  /** Why the entry exists; decides which entries the expiry job may remove. */
  readonly kind: EntryKind;

  /** What caused the entry (an order id, a campaign id); one entry per (memberId, reference) is the idempotency rule. */
  readonly reference: string;

  /** When the cause happened, from the caller's clock (the event time), not when the row was written. */
  readonly at: Date;
}
