/**
 * Stackra file contract:
 * Purpose: unit tests of `SynonymPermissions`: it is a permission set, a read is L0, a create and an update L1, a delete
 *          L2, and none is a system permission.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0099 (risk); ADR 0492 (decision 5).
 */
import { kindOf } from "@stackra/container";
import { Risk } from "@stackra/iam";
import { describe, expect, it } from "@stackra/testing";

import { SynonymPermissions } from "#node/access/synonym.permissions";

describe("SynonymPermissions", () => {
  it("is a permission set", () => {
    expect(kindOf(SynonymPermissions)?.kind).toBe("permissions");
  });

  it("gives each verb its risk, none a system permission", () => {
    const { read, create, update, delete: remove } = SynonymPermissions;
    expect([read, create, update, remove].map((permission) => permission.risk)).toEqual([
      Risk.L0,
      Risk.L1,
      Risk.L1,
      Risk.L2,
    ]);
    expect([read, create, update, remove].some((permission) => permission.isSystem)).toBe(false);
  });
});
