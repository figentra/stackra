/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: `Journal` (which the loyalty kit's Postgres driver injects as
 *          `Journal<LedgerEntry>`) is exported with the `@Journaled` facet, the `journalOf` token and the refusal, and
 *          nothing else is a value; the driver's calls fit the journal's signatures.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as ledger from "#core/index";

/** The loyalty kit's entry model, by shape. */
interface LedgerEntry {
  memberId: string;
  points: number;
  kind: "earn" | "redeem" | "expire";
  reference: string;
  at: Date;
}

describe("@stackra/ledger", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(ledger).sort()).toEqual([
      "Journal",
      "Journaled",
      "UnbalancedPostingError",
      "journalOf",
    ]);
  });

  it("takes the loyalty kit's call shapes", () => {
    type LoyaltyJournal = ledger.Journal<LedgerEntry>;

    expectTypeOf<{ account: string; amount: "points" }>().toExtend<
      Parameters<LoyaltyJournal["balance"]>[0]
    >();
    expectTypeOf<LoyaltyJournal["append"]>().returns.toEqualTypeOf<Promise<ledger.JournalWrite>>();
    expectTypeOf<{ floor: 0 }>().toExtend<NonNullable<Parameters<LoyaltyJournal["append"]>[1]>>();
    expectTypeOf<LoyaltyJournal["find"]>().returns.toEqualTypeOf<
      Promise<ledger.JournalEntry<LedgerEntry> | null>
    >();
    expectTypeOf<ledger.JournalEntry<LedgerEntry>["kind"]>().toEqualTypeOf<
      "earn" | "redeem" | "expire"
    >();
    expectTypeOf<LoyaltyJournal["reverseWhere"]>().returns.toEqualTypeOf<
      Promise<ledger.JournalEntry<LedgerEntry>[]>
    >();
    expectTypeOf<ledger.JournalLine<LedgerEntry>["floor"]>().toEqualTypeOf<
      number | null | undefined
    >();
    expectTypeOf<ledger.JournaledOptions["floor"]>().toEqualTypeOf<number | undefined>();
  });
});
