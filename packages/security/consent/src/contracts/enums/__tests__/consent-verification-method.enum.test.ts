/**
 * Stackra file contract:
 * Purpose: unit tests of `ConsentVerificationMethod`: the three methods a market pack may name, as snake_case codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0231; STA-1323.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ConsentVerificationMethod } from "#contracts/enums/consent-verification-method.enum";

describe("ConsentVerificationMethod", () => {
  it("has the three methods", () => {
    expect(Enum.values(ConsentVerificationMethod)).toEqual([
      "card_check",
      "signed_form",
      "guardian_login",
    ]);
  });
});
