/**
 * Stackra file contract:
 * Purpose: unit tests of `ConsentSnapshotPermissions`: it is a `Permissions` class and `issue` is a grantable L0
 *          permission.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0099; ADR 0462 (decision 1).
 */
import { Permission, Permissions, Risk } from "@stackra/iam";
import { describe, expect, it } from "@stackra/testing";

import { ConsentSnapshotPermissions } from "#node/access/consent-snapshot.permissions";

describe("ConsentSnapshotPermissions", () => {
  it("declares issue as a grantable L0 permission", () => {
    expect(Object.getPrototypeOf(ConsentSnapshotPermissions)).toBe(Permissions);
    expect(ConsentSnapshotPermissions.issue).toBeInstanceOf(Permission);
    expect(ConsentSnapshotPermissions.issue.risk).toBe(Risk.L0);
    expect(ConsentSnapshotPermissions.issue.isSystem).toBe(false);
  });
});
