/**
 * Stackra file contract:
 * Purpose: unit tests of `SubjectPermissions`: it is a `Permissions` class, `erase` is a system-held L4 permission
 *          and `export` a system-held L1 one.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0099; ADR 0189; STA-1299.
 */
import { Permission, Permissions, Risk } from "@stackra/iam";
import { describe, expect, it } from "@stackra/testing";

import { SubjectPermissions } from "#node/access/subject.permissions";

describe("SubjectPermissions", () => {
  it("declares erase and export as system-held permissions", () => {
    expect(Object.getPrototypeOf(SubjectPermissions)).toBe(Permissions);
    expect(SubjectPermissions.erase).toBeInstanceOf(Permission);
    expect(SubjectPermissions.erase.risk).toBe(Risk.L4);
    expect(SubjectPermissions.erase.isSystem).toBe(true);
    expect(SubjectPermissions.export.risk).toBe(Risk.L1);
    expect(SubjectPermissions.export.isSystem).toBe(true);
  });
});
