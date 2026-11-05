/**
 * Stackra file contract:
 * Purpose: unit tests of `moneyInputOf`: the currency beside the amount in the input wins, else the record's known
 *          currency with its scale, else none.
 * Boundary: test only; the schemas are small Zod objects.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0220 (money in minor units).
 */
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { moneyInputOf } from "#core/functions/money-input-of.function";

describe("moneyInputOf", () => {
  it("names the form's currency, the record's, or none", () => {
    const beside = z.object({ cost: z.object({ minor: z.number(), currency: z.string() }) });
    expect(moneyInputOf(beside, "cost.minor", undefined)).toEqual({
      currencyPath: "cost.currency",
    });
    const alone = z.object({ totalMinor: z.number() });
    expect(moneyInputOf(alone, "totalMinor", { currency: "AED" })).toEqual({
      currency: "AED",
      scale: 100,
    });
    expect(moneyInputOf(alone, "totalMinor", undefined)).toBeUndefined();
  });
});
