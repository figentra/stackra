/**
 * Stackra file contract:
 * Purpose: unit and type tests of `isTenantId`: a scope node's public id is a tenant id; another prefix, a short or
 *          upper-case body and a bare string are not; it narrows to `PublicId<"scp">`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decisions 3 and 8); ADR 0135.
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { isTenantId } from "#core/functions/is-tenant-id.function";

describe(isTenantId, () => {
  it("accepts a scope node's public id", () => {
    expect(isTenantId("scp_01j9z3k4m5n6p7q8r9s0t1v2w3")).toBe(true);
  });

  it("refuses another prefix, a malformed body and a bare string", () => {
    for (const value of [
      "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
      "scp_01j9z3",
      "scp_01J9Z3K4M5N6P7Q8R9S0T1V2W3",
      "scp_01j9z3k4m5n6p7q8r9s0t1v2w3x",
      "ten_a",
      "",
    ])
      expect(isTenantId(value)).toBe(false);
  });

  it("narrows to a scope node's public id", () => {
    const value = "scp_01j9z3k4m5n6p7q8r9s0t1v2w3" as string;
    if (isTenantId(value)) expectTypeOf(value).toEqualTypeOf<PublicId<"scp">>();
  });
});
