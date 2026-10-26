/**
 * Stackra file contract:
 * Purpose: unit tests of `CheckoutIntegration`: an Integration class of the payments shelf.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0308 (rule 1).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { CHECKOUT_WEBHOOKS } from "#core/providers/checkout/checkout-webhooks.constant";
import { CheckoutIntegration } from "#core/providers/checkout/checkout.integration";

describe("CheckoutIntegration", () => {
  it("is declared", () => {
    expect(CheckoutIntegration.name).toBe("CheckoutIntegration");
  });

  it("verifies webhooks with Checkout.com's recipe: a hex digest of the body", () => {
    expect(kindOf(CheckoutIntegration)?.options["webhooks"]).toBe(CHECKOUT_WEBHOOKS);
    expect(CHECKOUT_WEBHOOKS.signature).toEqual({
      header: "cko-signature",
      algorithm: "SHA-256",
      encoding: "hex",
      payload: "{body}",
    });
  });
});
