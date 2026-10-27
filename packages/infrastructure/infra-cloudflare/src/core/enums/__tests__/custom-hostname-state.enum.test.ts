/**
 * Stackra file contract:
 * Purpose: unit tests of `CustomHostnameState`: the six states of ADR 0276 open detail 1, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0276 (open detail 1).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { CustomHostnameState } from "#core/enums/custom-hostname-state.enum";

describe("CustomHostnameState", () => {
  it("lists the six states in order", () => {
    expect(Enum.values(CustomHostnameState)).toEqual([
      "pending_ownership",
      "pending_dns",
      "pending_certificate",
      "active",
      "failed",
      "removed",
    ]);
  });
});
