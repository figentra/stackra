/**
 * Stackra file contract:
 * Purpose: type tests of `ScopeRef`: a `scp` public id and a path are accepted, a wrong prefix or a missing path is
 *          refused, and no level exists on the type (ADR 0327 d2, d5).
 * Boundary: test only; the assertions are compile-time (`@ts-expect-error`, `expectTypeOf`) plus runtime checks.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { PublicId } from "#core/types/public-id.type";
import type { ScopeRef } from "#core/types/scope-ref.type";

describe("ScopeRef", () => {
  it("carries the node's scp id and its ltree path", () => {
    const scope: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3", path: "platform.acme.shop_eu" };
    expect(scope.path.split(".")).toHaveLength(3);
    expectTypeOf<ScopeRef["id"]>().toEqualTypeOf<PublicId<"scp">>();
  });

  it("refuses another prefix and a missing path", () => {
    // @ts-expect-error -- the id is a scope node's id, prefix scp
    const wrongPrefix: ScopeRef = { id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3", path: "platform" };
    // @ts-expect-error -- the path is required
    const noPath: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3" };
    expect([wrongPrefix, noPath]).toHaveLength(2);
  });

  it("names no level: levels are deployment data", () => {
    expectTypeOf<ScopeRef>().not.toHaveProperty("level");
  });
});
