/**
 * Stackra file contract:
 * Purpose: unit tests of `ApproverRefusal`: exactly its three snake_case codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0231 (snake_case codes); R3-SO-02.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ApproverRefusal } from "#contracts/enums/approver-refusal.enum";

describe("ApproverRefusal", () => {
  it("has the three refusal codes", () => {
    expect(Enum.values(ApproverRefusal)).toEqual([
      "seat_kind",
      "self_approval",
      "step_up_required",
    ]);
  });
});
