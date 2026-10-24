/**
 * Stackra file contract:
 * Purpose: unit tests of `RateLimitScope`: a bucket per credential, or one for the whole provider.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rule 13).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { RateLimitScope } from "#core/enums/rate-limit-scope.enum";

describe("RateLimitScope", () => {
  it("holds the credential and the integration scopes", () => {
    expect(Enum.values(RateLimitScope)).toEqual(["credential", "integration"]);
  });
});
