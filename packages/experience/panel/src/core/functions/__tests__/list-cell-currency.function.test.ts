/**
 * Stackra file contract:
 * Purpose: unit tests of `listCellCurrency`: a `…Minor` column takes the currency beside it in the item, else the
 *          record's; a nested column reads its own object's currency; other columns and a missing currency are not money.
 * Boundary: unit tier; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307.
 */
import { describe, expect, it } from "@stackra/testing";

import { listCellCurrency } from "#core/functions/list-cell-currency.function";

const record = { currency: "SAR" };

describe("listCellCurrency", () => {
  it("prefers the item's own currency, then the record's", () => {
    expect(
      listCellCurrency({ valueMinor: 5, currency: "EUR" }, "valueMinor", record, "currency"),
    ).toBe("EUR");
    expect(listCellCurrency({ valueMinor: 5 }, "valueMinor", record, "currency")).toBe("SAR");
  });

  it("reads a nested column's own currency", () => {
    const item = { unit: { priceMinor: 5, currency: "USD" } };
    expect(listCellCurrency(item, "unit.priceMinor", record, undefined)).toBe("USD");
  });

  it("is not money for another column or without a currency", () => {
    expect(listCellCurrency({ quantity: 2 }, "quantity", record, "currency")).toBeUndefined();
    expect(listCellCurrency({ valueMinor: 5 }, "valueMinor", record, undefined)).toBeUndefined();
  });
});
