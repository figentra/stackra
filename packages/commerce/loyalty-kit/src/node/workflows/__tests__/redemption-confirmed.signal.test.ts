/**
 * Stackra file contract:
 * Purpose: unit tests of `RedemptionConfirmed`: a signal, the one the redemption's `confirm` step waits for.
 * Boundary: test only; reads the recorded kind and the step's recorded options.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0152 (decision 1).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";
import { Step } from "@stackra/workflow";

import { RedeemPointsWorkflow } from "#node/workflows/redeem-points.workflow";
import { RedemptionConfirmed } from "#node/workflows/redemption-confirmed.signal";

describe("RedemptionConfirmed", () => {
  it("is a signal", () => {
    expect(kindOf(RedemptionConfirmed)?.kind).toBe("signal");
  });

  it("is what the redemption's confirm step waits for, for 15 minutes", () => {
    expect(Step.members(RedeemPointsWorkflow).get("confirm")).toMatchObject({
      waitFor: RedemptionConfirmed,
      timeout: "15m",
    });
  });
});
