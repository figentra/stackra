/**
 * Stackra file contract:
 * Purpose: unit tests of `CURRENCIES`: ISO 4217 codes with their exponents (KWD and BHD three, JPY none, CLF four),
 *          no code without minor units, frozen.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0220 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { CURRENCIES } from "#core/constants/currencies.constant";

describe("CURRENCIES", () => {
  it.each([
    ["USD", 2],
    ["EUR", 2],
    ["GBP", 2],
    ["SAR", 2],
    ["AED", 2],
    ["JPY", 0],
    ["KRW", 0],
    ["KWD", 3],
    ["BHD", 3],
    ["OMR", 3],
    ["CLF", 4],
    ["UYW", 4],
  ] as const)("gives %s an exponent of %d", (code, exponent) => {
    expect(CURRENCIES[code]).toBe(exponent);
  });

  it("keys every entry by three upper-case letters, with an exponent of 0, 2, 3 or 4", () => {
    for (const [code, exponent] of Object.entries(CURRENCIES)) {
      expect(code).toMatch(/^[A-Z]{3}$/);
      expect([0, 2, 3, 4]).toContain(exponent);
    }
  });

  it("leaves out codes that have no minor unit", () => {
    for (const code of ["XXX", "XTS", "XAU", "XAG", "XPT", "XPD", "XDR", "XSU", "XUA"])
      expect(Object.hasOwn(CURRENCIES, code)).toBe(false);
  });

  it("lists codes in alphabetical order and is frozen", () => {
    const codes = Object.keys(CURRENCIES);
    expect(codes).toEqual([...codes].sort());
    expect(Object.isFrozen(CURRENCIES)).toBe(true);
  });
});
