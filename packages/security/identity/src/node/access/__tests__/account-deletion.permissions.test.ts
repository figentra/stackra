/**
 * Stackra file contract:
 * Purpose: unit tests of `AccountDeletionPermissions`: asking is L4, cancelling L2, reading L1, and the erase job's
 *          permission L4 and system-held.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0462; STA-1567.
 */
import { Permission, Permissions, Risk } from "@stackra/iam";
import { describe, expect, it } from "@stackra/testing";

import { AccountDeletionPermissions } from "#node/access/account-deletion.permissions";

describe("AccountDeletionPermissions", () => {
  it("declares each verb with its risk", () => {
    expect(Object.getPrototypeOf(AccountDeletionPermissions)).toBe(Permissions);
    expect(AccountDeletionPermissions.request).toBeInstanceOf(Permission);
    expect(AccountDeletionPermissions.request.risk).toBe(Risk.L4);
    expect(AccountDeletionPermissions.cancel.risk).toBe(Risk.L2);
    expect(AccountDeletionPermissions.read.risk).toBe(Risk.L1);
    expect(AccountDeletionPermissions.erase.risk).toBe(Risk.L4);
  });
});
