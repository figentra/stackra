/**
 * Stackra file contract:
 * Purpose: unit and type tests of `refusal()`: it builds a real refusal of the class with some of its details, maps
 *          `fields` to the field errors, and needs no details at all.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0140.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ErrorKind, ForbiddenError, Refusal, isRefusal } from "#core/index";
import { refusal } from "#testing/functions/refusal.function";

class InsufficientStockError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  variantId!: string;
  available!: number;
}

describe("refusal", () => {
  it("builds a refusal of the class without details", () => {
    const denied = refusal(ForbiddenError);
    expect(isRefusal(denied, ForbiddenError)).toBe(true);
    expect(denied.details).toEqual({});
    expectTypeOf(denied).toEqualTypeOf<ForbiddenError>();
  });

  it("takes some of the details, not all", () => {
    const stock = refusal(InsufficientStockError, { available: 0 });
    expect(stock.details).toEqual({ available: 0 });
    expect(stock.code).toBe("insufficient_stock");
  });

  it("maps fields to the field errors, never to a detail", () => {
    const stock = refusal(InsufficientStockError, {
      fields: { "lines.0.variantId": "insufficient_stock" },
    });
    expect(stock.fieldErrors).toEqual({ "lines.0.variantId": "insufficient_stock" });
    expect(stock.details).toEqual({});
    expect(stock.toEnvelope().fieldErrors).toEqual({ "lines.0.variantId": "insufficient_stock" });
  });

  it("refuses a detail the class does not declare", () => {
    // @ts-expect-error -- not a detail of InsufficientStockError
    const wrong = refusal(InsufficientStockError, { orderId: "ord_1" });
    expect(wrong).toBeInstanceOf(InsufficientStockError);
  });
});
