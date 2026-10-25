/**
 * Stackra file contract:
 * Purpose: type tests of `CurrencyCode`: an upper-case ISO 4217 literal is assignable (a config default
 *          `defaultCurrency: CurrencyCode = "USD"`), a lower-case or unknown code is not, and the type covers exactly
 *          the keys of `CURRENCIES`.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0220 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import type { CURRENCIES } from "#core/constants/currencies.constant";
import type { CurrencyCode } from "#core/types/currency-code.type";

/** `true` only when `A` and `B` are the same type. */
type Same<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

describe("CurrencyCode", () => {
  it("takes an ISO 4217 literal, as a config default does", () => {
    const defaultCurrency: CurrencyCode = "USD";
    const yen: CurrencyCode = "JPY";
    expect([defaultCurrency, yen]).toEqual(["USD", "JPY"]);
  });

  it("refuses a lower-case, unknown or plain string", () => {
    // @ts-expect-error -- codes are upper-case
    const lower: CurrencyCode = "usd";
    // @ts-expect-error -- XXX has no minor unit
    const none: CurrencyCode = "XXX";
    const plain: string = "EUR";
    // @ts-expect-error -- a plain string is checked first (Money.ofMinor or currencyCode())
    const unchecked: CurrencyCode = plain;
    expect([lower, none, unchecked]).toEqual(["usd", "XXX", "EUR"]);
  });

  it("is exactly the keys of CURRENCIES", () => {
    const exact: Same<CurrencyCode, keyof typeof CURRENCIES> = true;
    expect(exact).toBe(true);
  });
});
