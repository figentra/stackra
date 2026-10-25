/**
 * Stackra file contract:
 * Purpose: unit tests of `BlockKind`, `DryRunOutcome` and `SeedResult`, the three codes the automation features add.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0153 (decision 1); ADR 0122 (decision 3); config-model section 6.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { BlockKind } from "#core/enums/block-kind.enum";
import { DryRunOutcome } from "#core/enums/dry-run-outcome.enum";
import { SeedResult } from "#core/enums/seed-result.enum";

describe("BlockKind", () => {
  it("has a trigger and an action", () => {
    expect(Enum.values(BlockKind)).toEqual(["trigger", "action"]);
  });

  it("is joined by the dry-run outcomes and the seed results", () => {
    expect(Enum.values(DryRunOutcome)).toEqual(["run", "skip", "wait"]);
    expect(Enum.values(SeedResult)).toEqual(["created", "updated", "kept", "current"]);
  });
});
