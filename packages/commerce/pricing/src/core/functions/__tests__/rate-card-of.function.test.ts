/**
 * Stackra file contract:
 * Purpose: unit tests of `rateCardOf and meterCharge`: rate and pack rows become a card, a meter is charged at its unit price in one currency, and missing or repeated rates are refused.
 * Boundary: test only; rows are test data standing in for `offer:<name>` and `rate-card:<name>` seed records.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0391 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { meterCharge } from "#core/functions/meter-charge.function";
import { rateCardOf } from "#core/functions/rate-card-of.function";

const RATE = {
  id: "wa",
  record: "rate",
  meter: "messaging.whatsapp",
  currency: "USD",
  unitPrice: "0.0125",
};
const card = rateCardOf("rate-card:messaging", [
  RATE,
  {
    id: "pack",
    record: "pack",
    meter: "messaging.whatsapp",
    currency: "USD",
    units: 1_000,
    price: "11.00",
  },
]);

describe("rateCardOf", () => {
  it("reads rates and prepaid packs", () => {
    expect(card.lines.map((line) => [line.meter, line.unitPrice.toDecimal()])).toEqual([
      ["messaging.whatsapp", "0.012500"],
    ]);
    expect(card.packs.map((pack) => [pack.units, pack.price.toDecimal()])).toEqual([
      [1_000, "11.00"],
    ]);
  });

  it("refuses repeated rates and unknown records", () => {
    expect(() => rateCardOf("rate-card:x", [RATE, { ...RATE, id: "again" }])).toThrow(
      /row again repeats/,
    );
    expect(() => rateCardOf("rate-card:x", [{ ...RATE, record: "tier" }])).toThrow(
      /unknown record tier/,
    );
  });
});

describe("meterCharge", () => {
  it("charges units at the meter's rate", () => {
    expect(meterCharge(card, "messaging.whatsapp", 1_200, "USD").toDecimal()).toBe("15.00");
    expect(() => meterCharge(card, "messaging.whatsapp", 1, "EUR")).toThrow(
      /no messaging.whatsapp rate in EUR/,
    );
  });
});
