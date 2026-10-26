/**
 * Stackra file contract:
 * Purpose: unit tests of `tenantId`: the id of the tenant's scope reference, under `platform` or the given parent, and
 *          a new tenant's id when no label is given.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decisions 2 and 3); ADR 0327 (decision 8).
 */
import { describe, expect, it } from "@stackra/testing";

import { tenantId } from "#core/functions/tenant-id.function";
import { tenantScopeRef } from "#core/functions/tenant-scope-ref.function";

describe("tenantId", () => {
  it("is the id of the tenant's scope reference", () => {
    expect(tenantId("acme")).toBe(tenantScopeRef("acme").id);
    expect(tenantId("shop", { under: "platform.acme" })).toBe("scp_tm8k4qw4fk2bdcfe0xxtngbeer");
    expect(tenantId()).toMatch(/^scp_[0-9a-hjkmnp-tv-z]{26}$/);
  });
});
