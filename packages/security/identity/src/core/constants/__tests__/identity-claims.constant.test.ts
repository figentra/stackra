/**
 * Stackra file contract:
 * Purpose: unit tests of `IDENTITY_CLAIMS`: the four Stackra claim names under one `urn:stackra:` namespace, frozen.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0206 (decision 2); ADR 0327 (decision 7).
 */
import { describe, expect, it } from "@stackra/testing";

import { IDENTITY_CLAIMS } from "#core/constants/identity-claims.constant";

describe("IDENTITY_CLAIMS", () => {
  it("names the Stackra claims", () => {
    expect(IDENTITY_CLAIMS).toEqual({
      userId: "urn:stackra:user_id",
      memberships: "urn:stackra:memberships",
      scopePath: "urn:stackra:scope_path",
      permissions: "urn:stackra:permissions",
    });
    expect(Object.isFrozen(IDENTITY_CLAIMS)).toBe(true);
  });
});
