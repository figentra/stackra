/**
 * Stackra file contract:
 * Purpose: unit tests of `LoyaltyAccountPermissions`: a permission set whose six verbs carry their risks, with
 *          `expire` held by the platform only and `stamp` (the stamp card) an ordinary L1 permission.
 * Boundary: test only; reads the statics and the recorded kind.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0132 as amended; ADR 0099.
 */
import { kindOf } from "@stackra/container";
import { Risk } from "@stackra/iam";
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyAccountPermissions } from "#node/access/loyalty-account.permissions";

describe("LoyaltyAccountPermissions", () => {
  it("is a permission set", () => {
    expect(kindOf(LoyaltyAccountPermissions)?.kind).toBe("permissions");
  });

  it("gives each verb its risk, and only expire is a system permission", () => {
    const { read, enroll, freeze, redeem, expire, stamp } = LoyaltyAccountPermissions;
    expect(
      [read, enroll, freeze, redeem, expire, stamp].map((permission) => permission.risk),
    ).toEqual([Risk.L0, Risk.L1, Risk.L2, Risk.L1, Risk.L2, Risk.L1]);
    expect([read, enroll, freeze, redeem, stamp].some((permission) => permission.isSystem)).toBe(
      false,
    );
    expect(expire.isSystem).toBe(true);
  });
});
