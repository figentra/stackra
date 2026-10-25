/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the configuration and its schema, the service, the memory ledger,
 *          the refusals, the shared views, the reference constants and the two functions are its values, and the
 *          constants keep the conventions every driver shares.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as core from "#core/index";

describe("@stackra/loyalty-kit", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(core).sort()).toEqual([
      "AccountFrozenError",
      "BalanceView",
      "EXPIRE_REFERENCE_PREFIX",
      "HOLD_REFERENCE_PREFIX",
      "InsufficientPointsError",
      "LoyaltyAccountView",
      "LoyaltyKitConfig",
      "LoyaltyKitConfig$",
      "LoyaltyKitOptions",
      "LoyaltyService",
      "MAX_POINTS_PER_ENTRY",
      "MemoryLoyaltyLedgerDriver",
      "NotAMemberError",
      "NotOwnPrincipalError",
      "PointsIssuedView",
      "RELEASE_REFERENCE_PREFIX",
      "SETTLE_REFERENCE_PREFIX",
      "isExpiringSoon",
      "memberId",
    ]);
  });

  it("keeps the reference conventions and the per-entry ceiling", () => {
    expect(core.EXPIRE_REFERENCE_PREFIX).toBe("expire:");
    expect(core.HOLD_REFERENCE_PREFIX).toBe("hold:");
    expect(core.RELEASE_REFERENCE_PREFIX).toBe("release:");
    expect(core.SETTLE_REFERENCE_PREFIX).toBe("settle:");
    expect(core.MAX_POINTS_PER_ENTRY).toBe(1_000_000);
  });
});
