/**
 * Stackra file contract:
 * Purpose: unit tests of `StripeIntegration`: an Integration class of the payments shelf.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0308 (rule 1).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { STRIPE_WEBHOOKS } from "#core/providers/stripe/stripe-webhooks.constant";
import { StripeIntegration } from "#core/providers/stripe/stripe.integration";

describe("StripeIntegration", () => {
  it("is declared", () => {
    expect(StripeIntegration.name).toBe("StripeIntegration");
    expect(typeof StripeIntegration).toBe("function");
  });

  it("sends form bodies and verifies webhooks with Stripe's recipe", () => {
    expect(kindOf(StripeIntegration)?.options).toMatchObject({
      requestBody: "form",
      webhooks: STRIPE_WEBHOOKS,
    });
    expect(STRIPE_WEBHOOKS.signature).toMatchObject({
      header: "stripe-signature",
      payload: "{timestamp}.{body}",
      encoding: "hex",
      algorithm: "SHA-256",
    });
  });
});
