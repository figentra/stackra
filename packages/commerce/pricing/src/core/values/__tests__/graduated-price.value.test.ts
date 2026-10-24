/**
 * Stackra file contract:
 * Purpose: unit tests of `GraduatedPrice`: the band checks of `of`, exact totals inside, on and across band bounds, an
 *          included first band, a single open band, and the refusals (bad quantity, overflow).
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0242 (decision 2).
 */
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import type { PriceTier } from "#core/types/price-tier.type";
import { GraduatedPrice } from "#core/values/graduated-price.value";

const cents = (minor: number) => Money.ofMinor(minor, "USD");

const tiers: PriceTier[] = [
  { upTo: 1_000, unitPrice: Money.zero("USD") },
  { upTo: 10_000, unitPrice: cents(2) },
  { upTo: null, unitPrice: cents(1) },
];
const messages = GraduatedPrice.of(tiers);

describe("GraduatedPrice.of", () => {
  it("holds the bands and their currency", () => {
    expect(messages.tiers).toEqual(tiers);
    expect(messages.currency).toBe("USD");
    expect(messages).toBeInstanceOf(GraduatedPrice);
  });

  it("keeps its own copy of the band list", () => {
    const list: PriceTier[] = [{ upTo: null, unitPrice: cents(5) }];
    const price = GraduatedPrice.of(list);
    list.push({ upTo: null, unitPrice: cents(9) });
    expect(price.tiers).toHaveLength(1);
  });

  it("refuses an empty list", () => {
    expect(() => GraduatedPrice.of([])).toThrow(RangeError);
  });

  it("refuses an open band before the last", () => {
    expect(() =>
      GraduatedPrice.of([
        { upTo: null, unitPrice: cents(1) },
        { upTo: null, unitPrice: cents(1) },
      ]),
    ).toThrow(RangeError);
  });

  it("refuses a bounded last band", () => {
    expect(() => GraduatedPrice.of([{ upTo: 100, unitPrice: cents(1) }])).toThrow(RangeError);
  });

  it.each([0, -5, 1.5, Number.NaN])("refuses the bound %s", (upTo) => {
    expect(() =>
      GraduatedPrice.of([
        { upTo, unitPrice: cents(1) },
        { upTo: null, unitPrice: cents(1) },
      ]),
    ).toThrow(RangeError);
  });

  it("refuses bounds that do not ascend", () => {
    expect(() =>
      GraduatedPrice.of([
        { upTo: 100, unitPrice: cents(2) },
        { upTo: 100, unitPrice: cents(1) },
        { upTo: null, unitPrice: cents(1) },
      ]),
    ).toThrow(RangeError);
  });

  it("refuses mixed currencies", () => {
    expect(() =>
      GraduatedPrice.of([
        { upTo: 100, unitPrice: cents(2) },
        { upTo: null, unitPrice: Money.ofMinor(1, "EUR") },
      ]),
    ).toThrow(RangeError);
  });
});

describe("GraduatedPrice#total", () => {
  it("is zero for no units and inside the included band", () => {
    expect(messages.total(0).equals(Money.zero("USD"))).toBe(true);
    expect(messages.total(1_000).minor).toBe(0);
  });

  it("prices each unit at the band it falls in", () => {
    expect(messages.total(1_001).minor).toBe(2);
    expect(messages.total(10_000).minor).toBe(18_000);
    expect(messages.total(10_001).minor).toBe(18_001);
    expect(messages.total(12_000).toDecimal()).toBe("200.00");
  });

  it("prices every unit at one rate with a single open band", () => {
    const flat = GraduatedPrice.of([{ upTo: null, unitPrice: cents(250) }]);
    expect(flat.total(3).toDecimal()).toBe("7.50");
  });

  it.each([-1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1])("refuses quantity %s", (quantity) => {
    expect(() => messages.total(quantity)).toThrow(RangeError);
  });

  it("refuses a total beyond the safe-integer limit", () => {
    const steep = GraduatedPrice.of([{ upTo: null, unitPrice: cents(1_000) }]);
    expect(() => steep.total(Number.MAX_SAFE_INTEGER)).toThrow(RangeError);
  });
});
