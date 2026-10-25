/**
 * Stackra file contract:
 * Purpose: unit tests of `PaymobIntegration`: an Integration class of the payments shelf.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0308 (rule 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { PaymobIntegration } from "#core/providers/paymob/paymob.integration";

describe("PaymobIntegration", () => {
  it("is declared", () => {
    expect(PaymobIntegration.name).toBe("PaymobIntegration");
  });
});
