/**
 * Stackra file contract:
 * Purpose: the re-export contract of ADR 0513: the permission vocabulary iam exports is the same objects as the
 *          `@stackra/contracts` and `@stackra/container` exports, so one registry is shared.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0513 (decision 3).
 */
import { Permissions, permissionKey, registerPermissions } from "@stackra/container";
import { Permission, Risk } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import * as iam from "#core/index";

describe("the permission vocabulary", () => {
  it("is re-exported from contracts and container, not copied", () => {
    expect(iam.Risk).toBe(Risk);
    expect(iam.Permission).toBe(Permission);
    expect(iam.Permissions).toBe(Permissions);
    expect(iam.registerPermissions).toBe(registerPermissions);
    expect(iam.permissionKey).toBe(permissionKey);
  });
});
