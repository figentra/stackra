/**
 * Stackra file contract:
 * Purpose: unit tests of `resolvePrice`: the applying list by currency, Market, channel and date; the most specific
 *          list that prices the item (a channel over a Market over a base); a channel list derived from the base with a
 *          markup and a price point; fixed, graduated and formula prices with their sources and rates; null when no
 *          list prices the item; and the refusals.
 * Boundary: test only; the lists are a test replica standing in for OS pricing data.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0337; ADR 0244; the RES-169 and MUS-216 answers.
 */
import { Money, Rounding } from "@stackra/money";
import type { RateSnapshot } from "@stackra/money/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PriceKind } from "#core/enums/price-kind.enum";
import { resolvePrice } from "#core/functions/resolve-price.function";
import type { PriceList } from "#core/types/price-list.type";
import type { PriceQuery } from "#core/types/price-query.type";
import { GraduatedPrice } from "#core/values/graduated-price.value";
import { PricePoint } from "#core/values/price-point.value";

const sar = (decimal: string) => Money.of(decimal, "SAR");
const gold = { base: "XAU", quote: "SAR", unit: "gram" } as const;
const goldRate: RateSnapshot = {
  ...gold,
  rate: "251.42",
  source: "feed",
  at: new Date("2026-10-25"),
};

/** An explicit list with no scope, dates or adjustment unless given. */
const list = (over: Partial<PriceList> & Pick<PriceList, "id">): PriceList => ({
  revision: "r1",
  currency: "SAR",
  market: null,
  channel: null,
  validFrom: null,
  validTo: null,
  prices: [],
  adjustment: null,
  ...over,
});

const base = list({
  id: "base",
  prices: [
    { itemId: "coffee", kind: PriceKind.Fixed, amount: sar("10.00") },
    {
      itemId: "sms",
      kind: PriceKind.Graduated,
      price: GraduatedPrice.of([
        { upTo: 100, unitPrice: Money.zero("SAR") },
        { upTo: null, unitPrice: Money.ofMinor(5, "SAR") },
      ]),
    },
    {
      itemId: "ring",
      kind: PriceKind.Formula,
      formula: {
        rounding: Rounding.HalfEven,
        terms: [{ rate: gold, amount: null, inputs: ["weight_grams", "purity"], factor: "1" }],
      },
    },
  ],
});
const ksa = list({
  id: "ksa",
  market: "mkt_ksa",
  prices: [{ itemId: "coffee", kind: PriceKind.Fixed, amount: sar("9.00") }],
});
const delivery = list({
  id: "delivery",
  channel: "chn_delivery_app",
  adjustment: {
    baseListId: "base",
    factor: "1.18",
    rounding: Rounding.HalfUp,
    pricePoint: PricePoint.ofMinor(50, 0, "SAR"),
  },
});
const lapsed = list({
  id: "lapsed",
  market: "mkt_ksa",
  validTo: new Date("2026-01-01"),
  prices: [{ itemId: "coffee", kind: PriceKind.Fixed, amount: sar("1.00") }],
});
const euros = list({
  id: "eur",
  currency: "EUR",
  prices: [{ itemId: "coffee", kind: PriceKind.Fixed, amount: Money.of("3.00", "EUR") }],
});
const lists = [euros, lapsed, base, ksa, delivery];

/** A query for one `itemId` in SAR now, with no Market or channel unless given. */
const query = (over: Partial<PriceQuery> & Pick<PriceQuery, "itemId">): PriceQuery => ({
  quantity: 1,
  currency: "SAR",
  market: null,
  channel: null,
  at: new Date("2026-10-25T12:00:00Z"),
  inputs: {},
  rates: [],
  ...over,
});

describe("resolvePrice", () => {
  it("takes the base list when nothing more specific applies", () => {
    const price = resolvePrice(lists, query({ itemId: "coffee", quantity: 2 }));
    expect(price?.total.toDecimal()).toBe("20.00");
    expect(price?.unitPrice?.toDecimal()).toBe("10.00");
    expect(price?.kind).toBe(PriceKind.Fixed);
    expect(price?.sources).toEqual([{ listId: "base", revision: "r1" }]);
  });

  it("prefers the Market's list and skips one out of its dates", () => {
    const price = resolvePrice(lists, query({ itemId: "coffee", market: "mkt_ksa" }));
    expect(price?.total.toDecimal()).toBe("9.00");
    expect(price?.sources).toEqual([{ listId: "ksa", revision: "r1" }]);
  });

  it("prefers the channel's derived list: markup, then the price point", () => {
    const price = resolvePrice(
      lists,
      query({ itemId: "coffee", market: "mkt_ksa", channel: "chn_delivery_app" }),
    );
    // 10.00 × 1.18 = 11.80, up to the next 0.50 point
    expect(price?.unitPrice?.toDecimal()).toBe("12.00");
    expect(price?.sources).toEqual([
      { listId: "delivery", revision: "r1" },
      { listId: "base", revision: "r1" },
    ]);
  });

  it("falls back to a less specific list that prices the item", () => {
    const ring = resolvePrice(
      lists,
      query({
        itemId: "ring",
        market: "mkt_ksa",
        inputs: { weight_grams: 12.5, purity: "0.75" },
        rates: [goldRate],
      }),
    );
    expect(ring?.kind).toBe(PriceKind.Formula);
    expect(ring?.total.toDecimal()).toBe("2357.06");
    expect(ring?.rates).toEqual([goldRate]);
  });

  it("prices graduated bands as a whole and scales them on a derived list", () => {
    const sms = resolvePrice(lists, query({ itemId: "sms", quantity: 300 }));
    expect([sms?.total.toDecimal(), sms?.unitPrice]).toEqual(["10.00", null]);
    const viaApp = resolvePrice(
      lists,
      query({ itemId: "sms", quantity: 300, channel: "chn_delivery_app" }),
    );
    expect(viaApp?.total.toDecimal()).toBe("11.80");
  });

  it("answers null when no list prices the item, or none is in the currency", () => {
    expect(resolvePrice(lists, query({ itemId: "tea" }))).toBeNull();
    expect(resolvePrice([euros], query({ itemId: "coffee" }))).toBeNull();
  });

  it("refuses a bad quantity, a missing or foreign base, and a cycle", () => {
    expect(() => resolvePrice(lists, query({ itemId: "coffee", quantity: 0 }))).toThrow(RangeError);
    const orphan = list({
      id: "orphan",
      adjustment: { baseListId: "gone", factor: "1", rounding: Rounding.HalfUp, pricePoint: null },
    });
    expect(() => resolvePrice([orphan], query({ itemId: "coffee" }))).toThrow(RangeError);
    const foreign = list({
      id: "foreign",
      adjustment: { baseListId: "eur", factor: "1", rounding: Rounding.HalfUp, pricePoint: null },
    });
    expect(() => resolvePrice([foreign, euros], query({ itemId: "coffee" }))).toThrow(RangeError);
    const a = list({
      id: "a",
      adjustment: { baseListId: "b", factor: "1", rounding: Rounding.HalfUp, pricePoint: null },
    });
    const b = list({
      id: "b",
      adjustment: { baseListId: "a", factor: "1", rounding: Rounding.HalfUp, pricePoint: null },
    });
    expect(() => resolvePrice([a, b], query({ itemId: "coffee" }))).toThrow(RangeError);
  });
});
