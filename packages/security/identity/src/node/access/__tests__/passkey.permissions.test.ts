/**
 * Stackra file contract:
 * Purpose: unit tests of `PasskeyPermissions`: the public challenge and the registration start are L2, the verify
 *          that mints a session and the confirm that keeps a new passkey L4.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0462; STA-1538.
 */
import { Permission, Permissions, Risk } from "@stackra/iam";
import { describe, expect, it } from "@stackra/testing";

import { PasskeyPermissions } from "#node/access/passkey.permissions";

describe("PasskeyPermissions", () => {
  it("declares the challenge and the registration start at L2, the verify and the confirm at L4", () => {
    expect(Object.getPrototypeOf(PasskeyPermissions)).toBe(Permissions);
    expect(PasskeyPermissions.challenge).toBeInstanceOf(Permission);
    expect(PasskeyPermissions.challenge.risk).toBe(Risk.L2);
    expect(PasskeyPermissions.verify.risk).toBe(Risk.L4);
    expect(PasskeyPermissions.register.risk).toBe(Risk.L2);
    expect(PasskeyPermissions.confirm.risk).toBe(Risk.L4);
  });
});
