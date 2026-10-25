/**
 * Stackra file contract:
 * Purpose: unit tests of `CheckoutIntegration`: an Integration class of the payments shelf.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0308 (rule 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { CheckoutIntegration } from "#core/providers/checkout/checkout.integration";

describe("CheckoutIntegration", () => {
  it("is declared", () => {
    expect(CheckoutIntegration.name).toBe("CheckoutIntegration");
  });
});
