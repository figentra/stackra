/**
 * Stackra file contract:
 * Purpose: type tests of `ScopeRef`: a level code and an id are accepted, a scope without an id is refused.
 * Boundary: test only; the assertions are compile-time (`@ts-expect-error`, `expectTypeOf`) plus runtime checks.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { ScopeRef } from "#core/types/scope-ref.type";

describe("ScopeRef", () => {
  it("names a level and an id", () => {
    const scope: ScopeRef = { level: "workspace", id: "0192f5c3-7c1e-7a40-9d5b-2f8c1e0a9b11" };
    expect(scope.level).toBe("workspace");
    expectTypeOf<ScopeRef["id"]>().toEqualTypeOf<string>();
  });

  it("refuses a scope without an id", () => {
    // @ts-expect-error -- the id is required
    const scope: ScopeRef = { level: "workspace" };
    expect(scope.level).toBe("workspace");
  });
});
