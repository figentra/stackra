/**
 * Stackra file contract:
 * Purpose: unit tests of `mapJournal`: account and tax keys become the provider's codes, everything else is kept; an
 *          unmapped account key or tax key is refused with that key, and an inherited object key never counts as mapped.
 * Boundary: test only; pure function.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; STA-794 (account mapping per Connection).
 */
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import type { AccountMap, JournalEntry } from "#contracts/index";
import { mapJournal } from "#core/accounting/map-journal.function";
import { UnmappedAccountError } from "#core/accounting/unmapped-account.error";

const sar = (minor: number) => Money.ofMinor(minor, "SAR");
const entry: JournalEntry = {
  date: new Date("2026-10-27"),
  narration: "Invoice 1",
  reference: "inv_1",
  lines: [
    { account: "receivables", side: "debit", amount: sar(11_500) },
    { account: "sales", side: "credit", amount: sar(10_000), taxCode: "vat_standard" },
    { account: "vat_output", side: "credit", amount: sar(1_500), description: "VAT" },
  ],
};
const map: AccountMap = {
  accounts: { receivables: "1100", sales: "4000", vat_output: "2200" },
  taxCodes: { vat_standard: "OUTPUT2" },
};

/** The refusal `run` throws. */
function refusal(run: () => unknown): UnmappedAccountError {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(UnmappedAccountError);
    return error as UnmappedAccountError;
  }
  throw new Error("expected a refusal");
}

describe("mapJournal", () => {
  it("maps account and tax keys to the provider's codes", () => {
    const mapped = mapJournal(entry, map);
    expect(mapped.lines.map((line) => [line.account, line.taxCode])).toEqual([
      ["1100", undefined],
      ["4000", "OUTPUT2"],
      ["2200", undefined],
    ]);
    expect(mapped.lines[2]?.description).toBe("VAT");
    expect(mapped.lines[0]?.amount).toBe(entry.lines[0]?.amount);
    expect(mapped.reference).toBe("inv_1");
    expect(entry.lines[0]?.account).toBe("receivables");
  });

  it("refuses an unmapped account key", () => {
    const error = refusal(() => mapJournal(entry, { ...map, accounts: { receivables: "1100" } }));
    expect(error.code).toBe("unmapped_account");
    expect(error.details).toEqual({ reference: "inv_1", account: "sales" });
  });

  it("refuses an unmapped tax key, also when the map has no tax codes", () => {
    expect(refusal(() => mapJournal(entry, { accounts: map.accounts })).details).toEqual({
      reference: "inv_1",
      taxCode: "vat_standard",
    });
  });

  it("never takes an inherited key as a mapping", () => {
    const inherited = {
      ...entry,
      lines: [{ account: "toString", side: "debit" as const, amount: sar(1) }],
    };
    expect(refusal(() => mapJournal(inherited, map)).details).toEqual({
      reference: "inv_1",
      account: "toString",
    });
  });
});
