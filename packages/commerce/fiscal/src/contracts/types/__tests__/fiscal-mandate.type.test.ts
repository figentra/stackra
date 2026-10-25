/**
 * Stackra file contract:
 * Purpose: type tests of `FiscalMandate`: a mandate with no window type-checks, one without a driver does not.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import type { FiscalMandate } from "#contracts/types/fiscal-mandate.type";

describe("FiscalMandate", () => {
  it("takes a driver key, options and nullable floors", () => {
    const mandate: FiscalMandate = {
      driver: "tse",
      options: {},
      reportingWindowHours: null,
      retentionYears: 10,
    };
    // @ts-expect-error -- a mandate always names its driver
    const driverless: FiscalMandate = {
      options: {},
      reportingWindowHours: null,
      retentionYears: null,
    };
    expect([mandate.driver, driverless.options]).toEqual(["tse", {}]);
  });
});
