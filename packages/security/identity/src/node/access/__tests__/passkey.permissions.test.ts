/**
 * Stackra file contract:
 * Purpose: unit tests of `PasskeyPermissions`: the public sign-in verbs are L0, the registration verbs L2.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0462; STA-1538.
 */
import { Permission, Permissions, Risk } from "@stackra/iam";
import { describe, expect, it } from "@stackra/testing";

import { PasskeyPermissions } from "#node/access/passkey.permissions";

describe("PasskeyPermissions", () => {
  it("declares the sign-in verbs at L0 and the registration verbs at L2", () => {
    expect(Object.getPrototypeOf(PasskeyPermissions)).toBe(Permissions);
    expect(PasskeyPermissions.challenge).toBeInstanceOf(Permission);
    expect(PasskeyPermissions.challenge.risk).toBe(Risk.L0);
    expect(PasskeyPermissions.verify.risk).toBe(Risk.L0);
    expect(PasskeyPermissions.register.risk).toBe(Risk.L2);
    expect(PasskeyPermissions.confirm.risk).toBe(Risk.L2);
  });
});
