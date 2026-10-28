/**
 * Stackra file contract:
 * Purpose: unit tests of `SubjectExportPermissions`: it is a `Permissions` class and `purge` is a system-held L4
 *          permission.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0099; ADR 0189; STA-1299.
 */
import { Permission, Permissions, Risk } from "@stackra/iam";
import { describe, expect, it } from "@stackra/testing";

import { SubjectExportPermissions } from "#node/access/subject-export.permissions";

describe("SubjectExportPermissions", () => {
  it("declares purge as a system-held L4 permission", () => {
    expect(Object.getPrototypeOf(SubjectExportPermissions)).toBe(Permissions);
    expect(SubjectExportPermissions.purge).toBeInstanceOf(Permission);
    expect(SubjectExportPermissions.purge.risk).toBe(Risk.L4);
    expect(SubjectExportPermissions.purge.isSystem).toBe(true);
  });
});
