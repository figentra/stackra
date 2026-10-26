/**
 * Stackra file contract:
 * Purpose: unit tests of `catalogueRowsError`: rows each kind's reader accepts give no error, a malformed plan
 *          catalogue or price list gives the reader's message, and a kind with no reader here is accepted.
 * Boundary: test only; runs the real readers of `@stackra/entitlements` and `@stackra/pricing`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0391 (decisions 2 and 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { catalogueRowsError } from "#core/functions/catalogue-rows-error.function";

const CATALOGUE = [
  { id: 1, record: "seat_kind", key: "staff" },
  { id: 2, record: "module", key: "payroll" },
  {
    id: 3,
    record: "tier",
    key: "pro",
    rank: 2,
    features: [],
    limits: { branches: null },
    seats: { staff: 5 },
    modules: ["payroll"],
  },
];

describe("catalogueRowsError", () => {
  it("accepts a well-formed plan catalogue and price list", () => {
    expect(
      catalogueRowsError("plan-catalogue", "plan-catalogue:commerce", CATALOGUE),
    ).toBeUndefined();
    expect(
      catalogueRowsError("price-list", "price-list:commerce", [
        {
          id: 1,
          regionalTier: "gcc",
          currency: "SAR",
          tier: "pro",
          period: "month",
          amount: "199.00",
        },
      ]),
    ).toBeUndefined();
  });

  it("gives the reader's message for rows it refuses", () => {
    expect(
      catalogueRowsError("plan-catalogue", "plan-catalogue:commerce", CATALOGUE.slice(1)),
    ).toContain("unknown seat kind staff");
    expect(
      catalogueRowsError("price-list", "price-list:commerce", [
        {
          id: 7,
          regionalTier: "gcc",
          currency: "SAR",
          tier: "pro",
          period: "fortnight",
          amount: "1",
        },
      ]),
    ).toContain("unknown period fortnight");
  });

  it("accepts a kind it has no reader for", () => {
    expect(
      catalogueRowsError("fee-schedule", "fee-schedule:commerce", [{ id: 1 }]),
    ).toBeUndefined();
  });
});
