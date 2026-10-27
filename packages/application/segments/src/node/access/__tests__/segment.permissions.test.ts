/**
 * Stackra file contract:
 * Purpose: unit tests of `SegmentPermissions`: it is a `Permissions` class and `recompute` is a system-held L1
 *          permission.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0099; ADR 0462 (decision 1); STA-1365 item 9.
 */
import { Permission, Permissions, Risk } from "@stackra/iam";
import { describe, expect, it } from "@stackra/testing";

import { SegmentPermissions } from "#node/access/segment.permissions";

describe("SegmentPermissions", () => {
  it("declares recompute as a system-held L1 permission", () => {
    expect(Object.getPrototypeOf(SegmentPermissions)).toBe(Permissions);
    expect(SegmentPermissions.recompute).toBeInstanceOf(Permission);
    expect(SegmentPermissions.recompute.risk).toBe(Risk.L1);
    expect(SegmentPermissions.recompute.isSystem).toBe(true);
  });
});
