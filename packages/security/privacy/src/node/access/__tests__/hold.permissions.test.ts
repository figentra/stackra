/**
 * Stackra file contract:
 * Purpose: unit tests of `HoldPermissions`: it is a `Permissions` class, `place` is L2, `release` L4 and `read` L1,
 *          none of them system-held.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0099; ADR 0134 (2026-10-24 amendment: holds).
 */
import { Permission, Permissions, Risk } from "@stackra/iam";
import { describe, expect, it } from "@stackra/testing";

import { HoldPermissions } from "#node/access/hold.permissions";

describe("HoldPermissions", () => {
  it("declares place, release and read with their risks for a compliance role", () => {
    expect(Object.getPrototypeOf(HoldPermissions)).toBe(Permissions);
    expect(HoldPermissions.place).toBeInstanceOf(Permission);
    expect(HoldPermissions.place.risk).toBe(Risk.L2);
    expect(HoldPermissions.release.risk).toBe(Risk.L4);
    expect(HoldPermissions.read.risk).toBe(Risk.L1);
    expect(HoldPermissions.place.isSystem).toBe(false);
  });
});
