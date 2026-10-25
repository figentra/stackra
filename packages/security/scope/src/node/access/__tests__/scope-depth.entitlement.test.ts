/**
 * Stackra file contract:
 * Purpose: unit tests of `ScopeDepthEntitlement`: an entitlement of kind `limit` (its grant is a number) whose required
 *          counted model is `ScopeNode`, declared without any gated call.
 * Boundary: test only; registers nothing, as the package registers no gate for it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0240 (decision 2); ADR 0242; ADR 0215 (decision 1).
 */
import { kindOf } from "@stackra/container";
import { Entitlement, EntitlementKind } from "@stackra/entitlements";
import { describe, expect, it } from "@stackra/testing";

import { ScopeDepthEntitlement } from "#node/access/scope-depth.entitlement";
import { ScopeNode } from "#node/models/scope-node.model";

describe("ScopeDepthEntitlement", () => {
  it("is a limit entitlement naming ScopeNode", () => {
    const record = kindOf(ScopeDepthEntitlement);
    const options = record?.options ?? {};
    expect(record?.kind).toBe("entitlement");
    expect(options["kind"]).toBe(EntitlementKind.Limit);
    expect((options["counts"] as () => unknown)()).toBe(ScopeNode);
    expect(new ScopeDepthEntitlement()).toBeInstanceOf(Entitlement);
  });
});
