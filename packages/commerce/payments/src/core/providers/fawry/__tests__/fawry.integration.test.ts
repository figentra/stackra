/**
 * Stackra file contract:
 * Purpose: unit tests of `FawryIntegration`: an Integration class of the payments shelf.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0308 (rule 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { FawryIntegration } from "#core/providers/fawry/fawry.integration";

describe("FawryIntegration", () => {
  it("is declared", () => {
    expect(FawryIntegration.name).toBe("FawryIntegration");
  });
});
