/**
 * Stackra file contract:
 * Purpose: unit tests of `splitTender`: eligible lines go to the restricted tender without their tax when the program
 *          is tax-exempt (with it otherwise), the rest to the remainder; a balance caps the restricted part and the
 *          waived tax follows in proportion, rounded down; the parts always add up to the basket; a bad input throws.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0445; R3-SO-08.
 */
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import type { RestrictedTenderProgram } from "#contracts/types/restricted-tender-program.type";
import type { TenderLine } from "#contracts/types/tender-line.type";
import type { TenderSplit } from "#contracts/types/tender-split.type";
import { splitTender } from "#core/functions/split-tender.function";

const usd = (minor: number): Money => Money.ofMinor(minor, "USD");

const program: RestrictedTenderProgram = {
  code: "snap",
  ruleSet: "rs",
  taxExempt: true,
  captureAtFulfilment: true,
  pinEntry: true,
};

/** Milk 2 x 1.50 (tax 0.30), soap 4.00 (tax 0.40), bread 2.00 (tax 0.20). */
const lines: readonly TenderLine[] = [
  { name: "Milk", quantity: 2, unitPrice: usd(150), tax: usd(30), category: "dairy" },
  { name: "Soap", quantity: 1, unitPrice: usd(400), tax: usd(40), category: "household" },
  { name: "Bread", quantity: 1, unitPrice: usd(200), tax: usd(20), category: "bakery" },
];
const eligible = [true, false, true];

/** The minor units of a split, for comparison. */
const minors = (split: TenderSplit): Record<string, number> => ({
  restricted: split.restricted.minor,
  remainder: split.remainder.minor,
  waivedTax: split.waivedTax.minor,
});

describe("splitTender", () => {
  it("pays the eligible lines tax-free and leaves the rest", () => {
    const split = splitTender(program, lines, eligible);
    expect(minors(split)).toEqual({ restricted: 500, remainder: 440, waivedTax: 50 });
    expect(split.eligible).toEqual([0, 2]);
    expect(split.program).toBe("snap");
  });

  it("keeps the tax on the restricted part when the program is not tax-exempt", () => {
    const split = splitTender({ ...program, taxExempt: false }, lines, eligible);
    expect(minors(split)).toEqual({ restricted: 550, remainder: 440, waivedTax: 0 });
  });

  it("caps at the balance and waives tax in proportion, rounded down", () => {
    const split = splitTender(program, lines, eligible, usd(333));
    // 50 * 333 / 500 = 33.3 -> 33 waived; 990 - 333 - 33 = 624 left
    expect(minors(split)).toEqual({ restricted: 333, remainder: 624, waivedTax: 33 });
  });

  it("pays nothing from a zero or negative balance or when nothing is eligible", () => {
    expect(minors(splitTender(program, lines, eligible, usd(-5)))).toEqual({
      restricted: 0,
      remainder: 990,
      waivedTax: 0,
    });
    expect(minors(splitTender(program, lines, [false, false, false]))).toEqual({
      restricted: 0,
      remainder: 990,
      waivedTax: 0,
    });
  });

  it("refuses an empty basket or a flag count that does not match", () => {
    expect(() => splitTender(program, [], [])).toThrow(RangeError);
    expect(() => splitTender(program, lines, [true])).toThrow(RangeError);
  });
});
