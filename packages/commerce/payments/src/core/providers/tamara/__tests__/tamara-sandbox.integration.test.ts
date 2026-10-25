/**
 * Stackra file contract:
 * Purpose: unit tests of `TamaraSandboxIntegration`: an Integration class of the payments shelf.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0359 (decision 11).
 */
import { describe, expect, it } from "@stackra/testing";

import { TamaraSandboxIntegration } from "#core/providers/tamara/tamara-sandbox.integration";

describe("TamaraSandboxIntegration", () => {
  it("is declared", () => {
    expect(TamaraSandboxIntegration.name).toBe("TamaraSandboxIntegration");
  });
});
