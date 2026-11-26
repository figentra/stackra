/**
 * Stackra file contract:
 * Purpose: unit tests of `LoginPolicyPermissions`: reading the tenant's login policy is L1, setting it L3.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0462; ADR 0099; STA-2817.
 */
import { Permission, Permissions, Risk } from "@stackra/iam";
import { describe, expect, it } from "@stackra/testing";

import { LoginPolicyPermissions } from "#node/access/login-policy.permissions";

describe("LoginPolicyPermissions", () => {
  it("declares each verb with its risk", () => {
    expect(Object.getPrototypeOf(LoginPolicyPermissions)).toBe(Permissions);
    expect(LoginPolicyPermissions.read).toBeInstanceOf(Permission);
    expect(LoginPolicyPermissions.read.risk).toBe(Risk.L1);
    expect(LoginPolicyPermissions.set.risk).toBe(Risk.L3);
  });
});
