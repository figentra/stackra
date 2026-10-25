/**
 * Stackra file contract:
 * Purpose: type tests of `FiscalPayment`: a tender type-checks, one without an amount does not.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import type { FiscalPayment } from "#contracts/types/fiscal-payment.type";

describe("FiscalPayment", () => {
  it("takes a method and an amount, and refuses a tender without an amount", () => {
    const cash: FiscalPayment = { method: "cash", amount: Money.ofMinor(100, "EUR") };
    // @ts-expect-error -- every tender has an amount
    const empty: FiscalPayment = { method: "cash" };
    expect([cash.method, empty.method]).toEqual(["cash", "cash"]);
  });
});
