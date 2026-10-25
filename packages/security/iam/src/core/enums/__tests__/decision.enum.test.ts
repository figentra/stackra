/**
 * Stackra file contract:
 * Purpose: unit test of `Decision`: allow, deny and abstain with their snake_case codes, as policies return them.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0132 (decision 4, as amended by 0294).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Decision } from "#core/enums/decision.enum";

describe("Decision", () => {
  it("holds allow, deny and abstain", () => {
    expect(Enum.values(Decision)).toEqual(["allow", "deny", "abstain"]);
    expect(Decision.Deny).toBe("deny");
  });
});
