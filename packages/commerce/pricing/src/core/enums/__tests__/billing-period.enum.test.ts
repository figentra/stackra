/**
 * Stackra file contract:
 * Purpose: unit tests of `BillingPeriod`: the two periods and their codes.
 * Boundary: test only; rows and pack values are test data standing in for seed-pack and market-pack records.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0391.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { BillingPeriod } from "#core/enums/billing-period.enum";

describe("BillingPeriod", () => {
  it("has month and year", () => {
    expect(Enum.values(BillingPeriod)).toEqual(["month", "year"]);
  });
});
