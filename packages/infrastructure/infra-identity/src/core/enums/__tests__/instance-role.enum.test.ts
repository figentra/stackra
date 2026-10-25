/**
 * Stackra file contract:
 * Purpose: unit tests of `InstanceRole`: ZITADEL's six instance member roles without the `IAM_` prefix, as snake_case
 *          codes that upper-case back to ZITADEL's names.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0207 (decision 2); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { InstanceRole } from "#core/enums/instance-role.enum";

describe("InstanceRole", () => {
  it("lists ZITADEL's instance roles", () => {
    expect(Enum.values(InstanceRole).map((role) => `IAM_${role.toUpperCase()}`)).toEqual([
      "IAM_OWNER",
      "IAM_OWNER_VIEWER",
      "IAM_ORG_MANAGER",
      "IAM_USER_MANAGER",
      "IAM_ADMIN_IMPERSONATOR",
      "IAM_END_USER_IMPERSONATOR",
    ]);
    expectTypeOf<InstanceRole>().toEqualTypeOf<
      | "owner"
      | "owner_viewer"
      | "org_manager"
      | "user_manager"
      | "admin_impersonator"
      | "end_user_impersonator"
    >();
  });

  it("uses snake_case codes", () => {
    for (const code of Enum.values(InstanceRole)) expect(code).toMatch(/^[a-z]+(?:_[a-z]+)*$/);
  });
});
