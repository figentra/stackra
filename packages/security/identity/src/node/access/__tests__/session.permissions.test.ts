/**
 * Stackra file contract:
 * Purpose: unit tests of `SessionPermissions`: listing one's own sessions is L1, ending one or all of them L2, and
 *          ending another user's L3.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0462; STA-1580.
 */
import { Permission, Permissions, Risk } from "@stackra/iam";
import { describe, expect, it } from "@stackra/testing";

import { SessionPermissions } from "#node/access/session.permissions";

describe("SessionPermissions", () => {
  it("declares each verb with its risk", () => {
    expect(Object.getPrototypeOf(SessionPermissions)).toBe(Permissions);
    expect(SessionPermissions.list).toBeInstanceOf(Permission);
    expect(SessionPermissions.list.risk).toBe(Risk.L1);
    expect(SessionPermissions.end.risk).toBe(Risk.L2);
    expect(SessionPermissions.endAll.risk).toBe(Risk.L2);
    expect(SessionPermissions.endUser.risk).toBe(Risk.L3);
  });
});
