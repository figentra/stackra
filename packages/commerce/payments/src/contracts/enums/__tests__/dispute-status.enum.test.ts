/**
 * Stackra file contract:
 * Purpose: unit tests of `DisputeStatus`: its snake_case codes, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { DisputeStatus } from "#contracts/enums/dispute-status.enum";

describe("DisputeStatus", () => {
  it("has its snake_case codes in order", () => {
    expect(Enum.values(DisputeStatus)).toEqual([
      "needs_response",
      "under_review",
      "won",
      "lost",
      "accepted",
    ]);
  });
});
