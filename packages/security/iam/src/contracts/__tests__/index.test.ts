/**
 * Stackra file contract:
 * Purpose: the contract of the `./contracts` entry: the port and `Capability` are its only values, and the snapshot,
 *          grant, rule and audience types resolve to their shapes.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";
import type { Condition } from "@stackra/rules";
import type { SegmentRef } from "@stackra/segments/contracts";
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
    expect(Object.keys(contracts).sort()).toEqual(["Capability", "PolicySource"]);
  });

  it("resolves its public types", () => {
    expectTypeOf<Grant["scope"]>().toEqualTypeOf<ScopeRef>();
    expectTypeOf<Grant["expiresAt"]>().toEqualTypeOf<Date | undefined>();
    expectTypeOf<Audience>().toEqualTypeOf<ScopeRef | SegmentRef | RoleRef>();
    expectTypeOf<Extract<Audience, { kind: "segment" }>>().toEqualTypeOf<SegmentRef>();
    expectTypeOf<SegmentRef["id"]>().toEqualTypeOf<PublicId<"seg">>();
    expectTypeOf<RoleRef["kind"]>().toEqualTypeOf<"role">();
    expectTypeOf<DenyRule["condition"]>().toEqualTypeOf<Condition | undefined>();
    expectTypeOf<VisibilityRule["capability"]>().toEqualTypeOf<Capability>();
    expectTypeOf<PolicySnapshot["segments"]>().toEqualTypeOf<readonly PublicId[]>();
    expectTypeOf<PolicySnapshot["denies"]>().toEqualTypeOf<readonly DenyRule[]>();
  });
});
