/**
 * Stackra file contract:
 * Purpose: unit tests of `FawrySandboxIntegration`: an Integration class of the payments shelf.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0359 (decision 11).
 */
import { describe, expect, it } from "@stackra/testing";

import { FawrySandboxIntegration } from "#core/providers/fawry/fawry-sandbox.integration";

describe("FawrySandboxIntegration", () => {
  it("is declared", () => {
    expect(FawrySandboxIntegration.name).toBe("FawrySandboxIntegration");
  });
});
