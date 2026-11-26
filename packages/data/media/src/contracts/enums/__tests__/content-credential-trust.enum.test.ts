/**
 * Stackra file contract:
 * Purpose: unit tests of `ContentCredentialTrust`: the three trust states and their codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; STA-2791 (CTO decision of 2026-11-25: trusted, unverified, invalid).
 */
import { describe, expect, it } from "@stackra/testing";

import { ContentCredentialTrust } from "#contracts/enums/content-credential-trust.enum";

describe("ContentCredentialTrust", () => {
  it("names the three trust states", () => {
    expect([
      ContentCredentialTrust.Trusted,
      ContentCredentialTrust.Unverified,
      ContentCredentialTrust.Invalid,
    ]).toEqual(["trusted", "unverified", "invalid"]);
  });
});
