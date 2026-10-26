/**
 * Stackra file contract:
 * Purpose: `PostgresLoyaltyLedgerDriver`, the default `LoyaltyLedger` driver: points entries kept in
 *          @stackra/ledger's `Journal<LedgerEntry>` over Postgres.
 * Boundary: implements the port only. Its name is the file prefix (`postgres`), the package default in
 *           `LoyaltyKitConfig`; the generated wiring loads it lazily, so it never reaches a browser bundle. The journal
 *           owns the arithmetic every ledger shares (append once per reference, the balance as a sum, a debit refused
 *           below a floor under the account's lock, set-based reversal cut at the floor); the kit keeps its own domain
 *           port, so a host can still `@Replaces` it. Every call states its floor: `append` none, `debit` and `expire`
 *           zero, so a spent earn's expiry is cut at zero instead of taking the balance negative. Runs inside whatever
 *           transaction and scope session the caller holds. No SQL is written here.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 15 and 16); ADR 0220 (decisions 4 and 5); ADR 0266.
 */
import { Driver } from "@stackra/container";
import type { Journal } from "@stackra/ledger/node";

import { DebitOutcome } from "#contracts/enums/debit-outcome.enum";
import { EntryKind } from "#contracts/enums/entry-kind.enum";
import { LoyaltyLedger } from "#contracts/ports/loyalty-ledger.port";
import type { MemberId } from "#contracts/types/member-id.type";
import type { PointsEntry } from "#contracts/types/points-entry.type";
import { EXPIRE_REFERENCE_PREFIX } from "#core/constants/expire-reference-prefix.constant";
import type { LedgerEntry } from "#node/models/ledger-entry.model";

/** The journal entry of a port entry. */
const journalEntryOf = (entry: PointsEntry) => ({
  account: entry.memberId,
  amount: entry.points,
  kind: entry.kind,
  reference: entry.reference,
  at: entry.at,
});

/**
 * The model's unique (scope, member, reference) index, not application logic, enforces idempotency.
 *
 * @example
 * export class LoyaltyKitConfig extends BaseLoyaltyKitConfig {
 *   override ledger = "postgres" as const;
 * }
 */
export class PostgresLoyaltyLedgerDriver extends Driver(LoyaltyLedger) {
  /** The journal over `loyalty_kit.ledger_entries`. */
  private readonly journal: Journal<LedgerEntry>;

  /**
   * @param journal - the journal over `loyalty_kit.ledger_entries`, isolated by the model's policy.
   */
  constructor(journal: Journal<LedgerEntry>) {
    super();
    this.journal = journal;
  }

  /** The sum of the member's entries; zero when it has none. */
  async balance(memberId: MemberId): Promise<number> {
    return this.journal.balance({ account: memberId });
  }

  /**
   * Appends the entry once per (member, reference) pair, with no floor: the port's plain append (a settle's redeem
   * line, a release, an adjustment) never refuses on the balance.
   *
   * @returns false, changing nothing, when the journal already holds the pair.
   */
  async append(entry: PointsEntry): Promise<boolean> {
    const { written } = await this.journal.append(journalEntryOf(entry), { floor: null });
    return written;
  }

  /**
   * Appends the debit only while the balance stays at or above zero, holding the member's account lock.
   *
   * @returns `uncovered` when the floor refused it, `duplicate` when the pair already exists.
   */
  async debit(entry: PointsEntry): Promise<DebitOutcome> {
    const { written, belowFloor } = await this.journal.append(journalEntryOf(entry), { floor: 0 });
    if (belowFloor) return DebitOutcome.Uncovered;
    return written ? DebitOutcome.Written : DebitOutcome.Duplicate;
  }

  /** The journal row under the (member, reference) pair, mapped back to the port's entry. */
  async find(memberId: MemberId, reference: string): Promise<PointsEntry | null> {
    const row = await this.journal.find({ account: memberId, reference });
    if (row === null) return null;
    return { memberId, points: row.amount, kind: row.kind, reference: row.reference, at: row.at };
  }

  /**
   * Reverses every stale earn in one locked journal call, oldest first, each cut at zero, so a crash mid-way leaves
   * nothing half done and a spent earn expires only what is left. Each reversal's reference is the earn's under
   * `EXPIRE_REFERENCE_PREFIX`, which makes a repeat reverse nothing more.
   */
  async expire(memberId: MemberId, before: Date): Promise<number> {
    const reversed = await this.journal.reverseWhere(
      { account: memberId, kind: EntryKind.Earn, before },
      { kind: EntryKind.Expire, referencePrefix: EXPIRE_REFERENCE_PREFIX, at: before, floor: 0 },
    );
    return reversed.reduce((sum, entry) => sum + entry.amount, 0);
  }
}
