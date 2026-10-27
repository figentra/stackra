/**
 * Stackra file contract:
 * Purpose: unit tests of `testScopeId`: the id of the tenant's scope reference, under `platform` or the given parent, and
 *          a new tenant's id when no label is given.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decisions 2 and 3); ADR 0327 (decision 8).
 */
import { describe, expect, it } from "@stackra/testing";

import { testScopeId } from "#core/functions/test-scope-id.function";
import { testScopeRef } from "#core/functions/test-scope-ref.function";

describe("testScopeId", () => {
  it("is the id of the tenant's scope reference", () => {
    expect(testScopeId("acme")).toBe(testScopeRef("acme").id);
    expect(testScopeId("shop", { under: "platform.acme" })).toBe("scp_tm8k4qw4fk2bdcfe0xxtngbeer");
    expect(testScopeId()).toMatch(/^scp_[0-9a-hjkmnp-tv-z]{26}$/);
  });
});
