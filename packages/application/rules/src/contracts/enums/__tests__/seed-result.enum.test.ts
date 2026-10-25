/**
 * Stackra file contract:
 * Purpose: unit tests of `SeedResult`: the four codes a seed of one rule-set template reports, in order.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; config-model section 6.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { SeedResult } from "#contracts/enums/seed-result.enum";

describe("SeedResult", () => {
  it("has the four seed results", () => {
    expect(Enum.values(SeedResult)).toEqual(["created", "updated", "kept", "current"]);
  });
});
