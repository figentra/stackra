/**
 * Stackra file contract:
 * Purpose: unit tests of `evaluateFormula`: a gold ring priced from the day's rate times weight and purity plus a
 *          making charge per gram, each term rounded once; the snapshots used are named once; and the refusals (no
 *          term, a missing input or rate, a foreign rate, a malformed term).
 * Boundary: test only; the formula and the rate are test data standing in for catalogue and feed data.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; the MUS-216 answer; ADR 0337.
 */
import { Rounding } from "@stackra/contracts";
import { Money } from "@stackra/money";
import type { RateSnapshot } from "@stackra/money/contracts";
import { describe, expect, it } from "@stackra/testing";

import { evaluateFormula } from "#core/functions/evaluate-formula.function";
import type { FormulaTerm } from "#core/types/formula-term.type";
import type { PriceFormula } from "#core/types/price-formula.type";

const gold = { base: "XAU", quote: "SAR", unit: "gram" } as const;
const rate: RateSnapshot = { ...gold, rate: "251.42", source: "feed", at: new Date("2026-10-25") };

const fineGold: FormulaTerm = {
  rate: gold,
  amount: null,
  inputs: ["weight_grams", "purity"],
  factor: "1",
};

const ring: PriceFormula = {
  rounding: Rounding.HalfEven,
  terms: [
    fineGold,
    { rate: null, amount: Money.of("20.00", "SAR"), inputs: ["weight_grams"], factor: "1" },
  ],
};

const inputs = { weight_grams: 12.5, purity: "0.75" };

describe("evaluateFormula", () => {
  it("prices fine metal at the rate plus a making charge", () => {
    const result = evaluateFormula(ring, inputs, [rate], "SAR");
    // 9.375 g × 251.42 = 2357.0625 → 2357.06; 12.5 g × 20.00 = 250.00
    expect(result.amount.toDecimal()).toBe("2607.06");
    expect(result.rates).toEqual([rate]);
  });

  it("names a snapshot once however many terms use it", () => {
    const twice: PriceFormula = { ...ring, terms: [fineGold, fineGold] };
    expect(evaluateFormula(twice, inputs, [rate], "SAR").rates).toEqual([rate]);
  });

  it("applies a constant factor and a flat amount", () => {
    const flat: PriceFormula = {
      rounding: Rounding.HalfUp,
      terms: [{ rate: null, amount: Money.of("100.00", "SAR"), inputs: [], factor: "0.5" }],
    };
    expect(evaluateFormula(flat, {}, [], "SAR").amount.toDecimal()).toBe("50.00");
  });

  it("refuses what it cannot price", () => {
    expect(() => evaluateFormula({ ...ring, terms: [] }, inputs, [rate], "SAR")).toThrow(
      RangeError,
    );
    expect(() => evaluateFormula(ring, { weight_grams: 12.5 }, [rate], "SAR")).toThrow(RangeError);
    expect(() => evaluateFormula(ring, inputs, [], "SAR")).toThrow(RangeError);
    expect(() => evaluateFormula(ring, inputs, [{ ...rate, unit: "troy_ounce" }], "SAR")).toThrow(
      RangeError,
    );
    expect(() => evaluateFormula(ring, inputs, [rate], "AED")).toThrow(RangeError);
    const malformed: PriceFormula = {
      rounding: Rounding.HalfEven,
      terms: [{ rate: gold, amount: Money.of("1.00", "SAR"), inputs: [], factor: "1" }],
    };
    expect(() => evaluateFormula(malformed, {}, [rate], "SAR")).toThrow(RangeError);
  });
});
