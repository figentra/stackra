/**
 * Stackra file contract:
 * Purpose: unit tests of `MoyasarIntegration`: an Integration class of the payments shelf.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0308 (rule 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { MoyasarIntegration } from "#core/providers/moyasar/moyasar.integration";

describe("MoyasarIntegration", () => {
  it("is declared", () => {
    expect(MoyasarIntegration.name).toBe("MoyasarIntegration");
  });
});
