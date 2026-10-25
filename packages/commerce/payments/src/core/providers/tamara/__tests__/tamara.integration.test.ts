/**
 * Stackra file contract:
 * Purpose: unit tests of `TamaraIntegration`: an Integration class of the payments shelf.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0308 (rule 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { TamaraIntegration } from "#core/providers/tamara/tamara.integration";

describe("TamaraIntegration", () => {
  it("is declared", () => {
    expect(TamaraIntegration.name).toBe("TamaraIntegration");
  });
});
