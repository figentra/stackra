/**
 * Stackra file contract:
 * Purpose: `MemoryLoyaltyLedgerDriver`, an in-memory `LoyaltyLedger` for tests and `ledger: "memory"`: the same
 *          idempotency, covered-debit and floored-expiry contract as the Postgres driver.
 * Boundary: the memory driver every capability ships before its production driver (ADR 0266). Its name is the file
 *           prefix (`memory`). Isomorphic, so it lives in core and ships from the `.` entry. Every check and write of
 *           `debit` and `expire` happens in one turn of the event loop, so a concurrent call of the same member always
 *           sees it, as the account lock makes it on Postgres. An expiry is cut at zero against the running balance,
 *           oldest earn first, exactly as the journal's floored reversal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 15 and 16); ADR 0266 (decision 2); ADR 0220 (decisions 4 and 5).
 */
import { Driver } from "@stackra/container";

import { DebitOutcome } from "#contracts/enums/debit-outcome.enum";
import { EntryKind } from "#contracts/enums/entry-kind.enum";
import { LoyaltyLedger } from "#contracts/ports/loyalty-ledger.port";
import type { MemberId } from "#contracts/types/member-id.type";
import type { PointsEntry } from "#contracts/types/points-entry.type";
import { EXPIRE_REFERENCE_PREFIX } from "#core/constants/expire-reference-prefix.constant";

/** The map key of an entry: what makes an append idempotent. */
const keyOf = (memberId: string, reference: string): string => `${memberId}|${reference}`;

/**
 * Holds entries in a Map for the life of the container, so every test gets a fresh ledger.
 *
 * @example
 * const ledger = new MemoryLoyaltyLedgerDriver();
 * await ledger.append({ memberId, points: 100, kind: EntryKind.Earn, reference: "ord_1", at });
 */
export class MemoryLoyaltyLedgerDriver extends Driver(LoyaltyLedger) {
  /** Entries keyed `<memberId>|<reference>`. */
  private readonly entries = new Map<string, PointsEntry>();

  /** Sums every entry of the member on each call; fine for tests, not a production path. */
  async balance(memberId: MemberId): Promise<number> {
    return this.sumOf(memberId);
  }

  /**
   * Stores the entry once per (memberId, reference) pair, with no balance check.
   *
   * @returns false and changes nothing when the pair was seen before.
   */
  async append(entry: PointsEntry): Promise<boolean> {
    const key = keyOf(entry.memberId, entry.reference);
    if (this.entries.has(key)) return false;
    this.entries.set(key, entry);
    return true;
  }

  /** Checks the balance and stores the entry with no `await` between them. */
  async debit(entry: PointsEntry): Promise<DebitOutcome> {
    const key = keyOf(entry.memberId, entry.reference);
    if (this.entries.has(key)) return DebitOutcome.Duplicate;
    if (this.sumOf(entry.memberId) + entry.points < 0) return DebitOutcome.Uncovered;
    this.entries.set(key, entry);
    return DebitOutcome.Written;
  }

  /** The stored entry under the pair, or null. */
  async find(memberId: MemberId, reference: string): Promise<PointsEntry | null> {
    return this.entries.get(keyOf(memberId, reference)) ?? null;
  }

  /**
   * Writes one `expire` entry per stale `earn` entry that has none, oldest first, each cut so the balance stops at
   * zero; a cut-to-nothing expiry is still written, so a repeat expires nothing more.
   */
  async expire(memberId: MemberId, before: Date): Promise<number> {
    const stale = [...this.entries.values()]
      .filter((e) => e.memberId === memberId && e.kind === EntryKind.Earn && e.at < before)
      .sort((a, b) => a.at.getTime() - b.at.getTime() || a.reference.localeCompare(b.reference));
    let balance = this.sumOf(memberId);
    let removed = 0;
    for (const earn of stale) {
      const key = keyOf(memberId, `${EXPIRE_REFERENCE_PREFIX}${earn.reference}`);
      if (this.entries.has(key)) continue;
      const cut = Math.min(earn.points, Math.max(0, balance));
      this.entries.set(key, {
        memberId,
        points: -cut || 0, // `|| 0`: a cut-to-nothing expiry stores 0, never -0
        kind: EntryKind.Expire,
        reference: `${EXPIRE_REFERENCE_PREFIX}${earn.reference}`,
        at: before,
      });
      balance -= cut;
      removed += cut;
    }
    return removed;
  }

  /** The synchronous sum `balance`, `debit` and `expire` share, so they check without yielding. */
  private sumOf(memberId: MemberId): number {
    let sum = 0;
    for (const e of this.entries.values()) if (e.memberId === memberId) sum += e.points;
    return sum;
  }
}
