/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: `Journal` (which the loyalty kit's Postgres driver injects as
 *          `Journal<LedgerEntry>`) and the `journalOf` token are its only values, and the driver's calls fit the
 *          journal's signatures.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { JournalEntry, JournalWrite } from "#core/index";
import * as ledgerNode from "#node/index";

/** The loyalty kit's entry model, by shape. */
interface LedgerEntry {
  memberId: string;
  points: number;
  kind: "earn" | "redeem" | "expire";
  reference: string;
  at: Date;
}

describe("@stackra/ledger/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(ledgerNode).sort()).toEqual(["Journal", "journalOf"]);
  });

  it("takes the loyalty kit's call shapes", () => {
    type LoyaltyJournal = ledgerNode.Journal<LedgerEntry>;

    expectTypeOf<{ account: string; amount: "points" }>().toExtend<
      Parameters<LoyaltyJournal["balance"]>[0]
    >();
    expectTypeOf<LoyaltyJournal["append"]>().returns.toEqualTypeOf<Promise<JournalWrite>>();
    expectTypeOf<{ floor: 0 }>().toExtend<NonNullable<Parameters<LoyaltyJournal["append"]>[1]>>();
    expectTypeOf<LoyaltyJournal["find"]>().returns.toEqualTypeOf<
      Promise<JournalEntry<LedgerEntry> | null>
    >();
    expectTypeOf<LoyaltyJournal["reverseWhere"]>().returns.toEqualTypeOf<
      Promise<JournalEntry<LedgerEntry>[]>
    >();
  });
});
