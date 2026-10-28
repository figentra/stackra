/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the `@Journaled` facet and the refusal are its only values (no
 *          database import), and the entry types keep the shapes the loyalty kit's driver reads, including the
 *          optional currency.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import type { CurrencyCode } from "@stackra/money";
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
    expect(Object.keys(ledger).sort()).toEqual(["Journaled", "UnbalancedPostingError"]);
  });

  it("keeps the entry types the loyalty kit reads", () => {
    expectTypeOf<ledger.JournalEntry<LedgerEntry>["kind"]>().toEqualTypeOf<
      "earn" | "redeem" | "expire"
    >();
    expectTypeOf<ledger.JournalEntry<LedgerEntry>["currency"]>().toEqualTypeOf<
      CurrencyCode | undefined
    >();
    expectTypeOf<ledger.JournalLine<LedgerEntry>["floor"]>().toEqualTypeOf<
      number | null | undefined
    >();
    expectTypeOf<ledger.JournaledOptions["floor"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<ledger.JournaledOptions["currency"]>().toEqualTypeOf<string | undefined>();
  });
});
