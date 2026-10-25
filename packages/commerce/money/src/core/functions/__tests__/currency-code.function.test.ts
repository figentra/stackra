/**
 * Stackra file contract:
 * Purpose: unit and type tests of `currencyCode()`: it accepts exactly the codes of `CURRENCIES`, case-sensitively,
 *          takes a `.default("USD")` as generated config schemas write it, and outputs exactly `CurrencyCode`.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0127 2026-10-24 note;
 *                     ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";
import type { z } from "zod";

import { CURRENCIES } from "#core/constants/currencies.constant";
import { currencyCode } from "#core/functions/currency-code.function";
import type { CurrencyCode } from "#core/types/currency-code.type";

/** `true` only when `A` and `B` are the same type, as the generated `Same` is. */
type Same<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

describe("currencyCode()", () => {
  it.each(["USD", "EUR", "JPY", "KWD", "SAR", "AED"])("accepts %s", (code) => {
    expect(currencyCode().parse(code)).toBe(code);
  });

  it.each(["usd", "Usd", "XXX", "XAU", "US", "USDT", "", 840, null])("refuses %j", (code) => {
    expect(currencyCode().safeParse(code).success).toBe(false);
  });

  it("accepts every code of the table and nothing else", () => {
    expect([...currencyCode().options].sort()).toEqual(Object.keys(CURRENCIES).sort());
  });

  it("takes a default, as a generated config schema writes it", () => {
    expect(currencyCode().default("USD").parse(undefined)).toBe("USD");
  });

  it("outputs exactly CurrencyCode", () => {
    const exact: Same<z.output<ReturnType<typeof currencyCode>>, CurrencyCode> = true;
    expect(exact).toBe(true);
  });
});
