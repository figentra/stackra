/**
 * Stackra file contract:
 * Purpose: unit tests of `CheckoutSandboxIntegration`: an Integration class of the payments shelf.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0359 (decision 11).
 */
import { describe, expect, it } from "@stackra/testing";

import { CheckoutSandboxIntegration } from "#core/providers/checkout/checkout-sandbox.integration";

describe("CheckoutSandboxIntegration", () => {
  it("is declared", () => {
    expect(CheckoutSandboxIntegration.name).toBe("CheckoutSandboxIntegration");
  });
});
