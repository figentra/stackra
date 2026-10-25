/**
 * Stackra file contract:
 * Purpose: unit tests of `stripeParams`: nested objects and arrays become bracket keys, undefined and null drop out.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { stripeParams } from "#core/providers/stripe/stripe-params.function";

describe("stripeParams", () => {
  it("flattens to Stripe's bracket notation", () => {
    expect(
      stripeParams({
        mode: "payment",
        skip: undefined,
        none: null,
        metadata: { reference: "ord_1" },
        line_items: [{ quantity: 1, price_data: { unit_amount: 500 } }],
        confirm: true,
      }),
    ).toEqual({
      mode: "payment",
      "metadata[reference]": "ord_1",
      "line_items[0][quantity]": 1,
      "line_items[0][price_data][unit_amount]": 500,
      confirm: true,
    });
  });
});
