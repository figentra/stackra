/**
 * Stackra file contract:
 * Purpose: unit test of `Capability`: the three capabilities of ADR 0333 with their stored snake_case codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0333 (decision 2).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Capability } from "#contracts/enums/capability.enum";

describe("Capability", () => {
  it("holds see, list, use and exists, in that order", () => {
    expect(Enum.values(Capability)).toEqual(["see", "list", "use", "exists"]);
    expect(Capability.Use).toBe("use");
  });
});
