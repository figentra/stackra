/**
 * Stackra file contract:
 * Purpose: unit tests of `unownedTableGroup`: a scope_path policy, a scope_id policy on the owner setting and no
 *          row-level security each name their group; anything else is unclassified.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0347 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { unownedTableGroup } from "#testing/functions/unowned-table-group.function";
import type { PolicyRow } from "#testing/types/policy-row.type";

/** A permissive FOR ALL policy with `using`. */
const policy = (using: string): PolicyRow => ({
  name: "pol_x",
  permissive: true,
  command: "*",
  using,
  check: "",
});

describe("unownedTableGroup", () => {
  it("names the ancestor scope_path group", () => {
    expect(unownedTableGroup(true, [policy("(scope_path ? ARRAY(...))")], "app.tenant_id")).toBe(
      "an ancestor scope_path table awaiting the contract step",
    );
  });

  it("names the scope_id group only for a policy on the owner setting", () => {
    const scoped = policy(
      "(NOT (scope_id IS DISTINCT FROM current_setting('app.tenant_id'::text, true)))",
    );
    expect(unownedTableGroup(true, [scoped], "app.tenant_id")).toBe(
      "a scope_id table whose policy reads app.tenant_id",
    );
    expect(unownedTableGroup(true, [scoped], "app.owner_id")).toBe("unclassified");
  });

  it("names the no-RLS system group", () => {
    expect(unownedTableGroup(false, [], "app.tenant_id")).toBe(
      "a system table with no row-level security, awaiting its ADR decision",
    );
  });

  it("falls back to unclassified", () => {
    expect(unownedTableGroup(true, [], "app.tenant_id")).toBe("unclassified");
    expect(unownedTableGroup(true, [policy("true")], "app.tenant_id")).toBe("unclassified");
  });
});
