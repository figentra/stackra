/**
 * Stackra file contract:
 * Purpose: unit tests of `StripeIntegration`: an Integration class of the payments shelf.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0308 (rule 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { StripeIntegration } from "#core/providers/stripe/stripe.integration";

describe("StripeIntegration", () => {
  it("is declared", () => {
    expect(StripeIntegration.name).toBe("StripeIntegration");
    expect(typeof StripeIntegration).toBe("function");
  });
});
