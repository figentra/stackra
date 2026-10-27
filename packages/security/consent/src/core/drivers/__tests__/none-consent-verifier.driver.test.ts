/**
 * Stackra file contract:
 * Purpose: unit tests of `NoneConsentVerifierDriver`: it is a `ConsentVerifier` and fails every method closed.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; STA-1323.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ConsentVerificationMethod } from "#contracts/enums/consent-verification-method.enum";
import { ConsentVerifier } from "#contracts/ports/consent-verifier.port";
import { NoneConsentVerifierDriver } from "#core/drivers/none-consent-verifier.driver";

const PARENT = "usr_01j9z3k4m5n6p7q8r9s0t1v2p1";
const CHILD = "usr_01j9z3k4m5n6p7q8r9s0t1v2c1";

describe("NoneConsentVerifierDriver", () => {
  it("refuses every method", async () => {
    const verifier: ConsentVerifier = new NoneConsentVerifierDriver();
    expect(verifier).toBeInstanceOf(ConsentVerifier);
    for (const method of Enum.values(ConsentVerificationMethod))
      expect(
        await verifier.verify({
          method,
          subject: CHILD,
          givenBy: PARENT,
          document: "photos",
          evidence: "x",
        }),
      ).toEqual({ verified: false });
  });
});
