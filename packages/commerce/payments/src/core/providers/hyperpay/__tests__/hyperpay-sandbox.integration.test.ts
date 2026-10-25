/**
 * Stackra file contract:
 * Purpose: unit tests of `HyperpaySandboxIntegration`: an Integration class of the payments shelf.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0359 (decision 11).
 */
import { describe, expect, it } from "@stackra/testing";

import { HyperpaySandboxIntegration } from "#core/providers/hyperpay/hyperpay-sandbox.integration";

describe("HyperpaySandboxIntegration", () => {
  it("is declared", () => {
    expect(HyperpaySandboxIntegration.name).toBe("HyperpaySandboxIntegration");
  });
});
