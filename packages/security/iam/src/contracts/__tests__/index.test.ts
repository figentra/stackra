/**
 * Stackra file contract:
 * Purpose: the contract of the `./contracts` entry: the port and `Capability` are its only values, and the snapshot,
 *          grant, rule and audience types resolve to their shapes; an audience is a scope or a role, never a segment
 *          (ADR 0462).
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15); ADR 0462 (decision 1).
 */
import type { ScopeRef } from "@stackra/contracts";
import type { Condition } from "@stackra/rules";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type {
  Audience,
  Capability,
  DenyRule,
  Grant,
  PolicySnapshot,
  RoleRef,
  VisibilityRule,
} from "#contracts/index";

describe("@stackra/iam/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "Audience$",
      "Capability",
      "DimensionValues",
      "FieldAccess",
      "PolicySnapshotStore",
      "PolicySource",
      "RoleGrants",
      "RolesAtNode",
    ]);
  });

  it("resolves its public types", () => {
    expectTypeOf<Grant["scope"]>().toEqualTypeOf<ScopeRef>();
    expectTypeOf<Grant["expiresAt"]>().toEqualTypeOf<Date | undefined>();
    expectTypeOf<Audience>().toEqualTypeOf<ScopeRef | RoleRef>();
    expectTypeOf<Extract<Audience, { kind: "segment" }>>().toEqualTypeOf<never>();
    expectTypeOf<RoleRef["kind"]>().toEqualTypeOf<"role">();
    expectTypeOf<DenyRule["condition"]>().toEqualTypeOf<Condition | undefined>();
    expectTypeOf<VisibilityRule["capability"]>().toEqualTypeOf<Capability>();
    expectTypeOf<keyof PolicySnapshot>().toEqualTypeOf<
      "version" | "grants" | "roles" | "denies" | "visibility" | "fields" | "breakGlass"
    >();
    expectTypeOf<PolicySnapshot["denies"]>().toEqualTypeOf<readonly DenyRule[]>();
  });
});
