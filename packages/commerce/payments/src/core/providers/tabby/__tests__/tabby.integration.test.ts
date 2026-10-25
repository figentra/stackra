/**
 * Stackra file contract:
 * Purpose: unit tests of `TabbyIntegration`: an Integration class of the payments shelf.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0308 (rule 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { TabbyIntegration } from "#core/providers/tabby/tabby.integration";

describe("TabbyIntegration", () => {
  it("is declared", () => {
    expect(TabbyIntegration.name).toBe("TabbyIntegration");
  });
});
