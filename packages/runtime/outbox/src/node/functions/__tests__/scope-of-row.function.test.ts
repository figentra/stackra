/**
 * Stackra file contract:
 * Purpose: unit tests of `scopeOfRow`: both scope columns give a `ScopeRef`, either one null gives no scope.
 * Boundary: test only; plain row objects.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0327.
 */
import { describe, expect, it } from "@stackra/testing";

import { scopeOfRow } from "#node/functions/scope-of-row.function";

describe("scopeOfRow", () => {
  it("reads both scope columns as a scope", () => {
    expect(scopeOfRow({ scope_id: "scp_1", scope_path: "a.b" })).toEqual({
      scope: { id: "scp_1", path: "a.b" },
    });
  });

  it("gives no scope when either column is null", () => {
    expect(scopeOfRow({ scope_id: null, scope_path: "a.b" })).toEqual({});
    expect(scopeOfRow({ scope_id: "scp_1", scope_path: null })).toEqual({});
  });
});
