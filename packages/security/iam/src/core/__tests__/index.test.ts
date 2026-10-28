/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: every value the template imports from `@stackra/iam` (`Decision`,
 *          `Permission`, `Permissions`, `Policy`, `Risk`, `SystemRole`) and the registry row's `Role` and decision
 *          point are exported, nothing else is, the registries stay internal, and the public types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import type { AnyClass } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";
import type { Rules } from "@stackra/rules";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as iam from "#core/index";
import type {
  AccessExplanation,
  AccessReason,
  CheckOptions,
  MemoryPolicyState,
  PermissionRegistration,
  PolicyOptions,
  PolicyRegistration,
  RecordFacts,
  RoleOptions,
  RoleRegistration,
  VisibleConditionOptions,
} from "#core/index";

describe("@stackra/iam", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(iam).sort()).toEqual([
      "AccessReason",
      "Decision",
      "IamAccessControlDriver",
      "IamGrantedScopesDriver",
      "IamRolesAtNodeDriver",
      "MemoryPolicySnapshotStoreDriver",
      "MemoryPolicySourceDriver",
      "Permission",
      "PermissionSnapshotService",
      "Permissions",
      "Policy",
      "PolicyDecisionPointService",
      "PolicySnapshotIntakeService",
      "Risk",
      "Role",
      "StorePolicySourceDriver",
      "SystemRole",
      "assertFieldsReadable",
      "assertFieldsWritable",
      "breakGlassGrant",
      "connectPolicies",
      "decodePolicySnapshot",
      "existenceHit",
      "hiddenColumns",
      "permissionKey",
      "redactFields",
      "registerDimensions",
      "registerPermissions",
      "registerPolicies",
      "registerRoles",
    ]);
  });

  it("resolves its public types", () => {
    expectTypeOf<AccessExplanation["reason"]>().toEqualTypeOf<AccessReason>();
    expectTypeOf<CheckOptions["scope"]>().toEqualTypeOf<ScopeRef | undefined>();
    expectTypeOf<CheckOptions["record"]>().toEqualTypeOf<RecordFacts | null | undefined>();
    expectTypeOf<RecordFacts["rules"]>().toEqualTypeOf<Rules>();
    expectTypeOf<PermissionRegistration["keys"]>().toEqualTypeOf<
      Readonly<Record<string, string>>
    >();
    expectTypeOf<PolicyOptions["permissions"]>().toEqualTypeOf<
      AnyClass<iam.Permissions> | undefined
    >();
    expectTypeOf<PolicyRegistration["model"]>().toEqualTypeOf<AnyClass>();
    expectTypeOf<RoleOptions["grants"]>().toEqualTypeOf<readonly iam.Permission[]>();
    expectTypeOf<RoleRegistration["key"]>().toEqualTypeOf<string>();
    expectTypeOf<VisibleConditionOptions["unmatched"]>().toEqualTypeOf<
      typeof iam.Decision.Allow | typeof iam.Decision.Deny
    >();
    expectTypeOf<VisibleConditionOptions["rules"]>().toEqualTypeOf<Rules | undefined>();
    expectTypeOf<MemoryPolicyState["roles"]>().toEqualTypeOf<
      Readonly<Record<string, readonly string[]>> | undefined
    >();
  });
});
