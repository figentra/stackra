/**
 * Stackra file contract:
 * Purpose: unit test of `OperatorPermissions`: the bootstrap is L4 and system-held, so no role ever grants it.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0462; STA-1586.
 */
import { Permission, Permissions, Risk } from "@stackra/iam";
import { describe, expect, it } from "@stackra/testing";

import { OperatorPermissions } from "#node/access/operator.permissions";

describe("OperatorPermissions", () => {
  it("declares the bootstrap as L4 and system-held", () => {
    expect(Object.getPrototypeOf(OperatorPermissions)).toBe(Permissions);
    expect(OperatorPermissions.bootstrap).toBeInstanceOf(Permission);
    expect(OperatorPermissions.bootstrap.risk).toBe(Risk.L4);
    expect(OperatorPermissions.bootstrap.isSystem).toBe(true);
  });
});
