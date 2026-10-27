/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the gen wiring imports `ConsentStore` from
 *          `@stackra/consent/contracts`; the four ports and the verification method enum are its values, `ConsentRecord`
 *          resolves to the stored decision's shape and the verification types keep theirs.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { ConsentRecord } from "#contracts/index";

describe("@stackra/consent/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "ConsentAuthority",
      "ConsentProofStore",
      "ConsentStore",
      "ConsentVerificationMethod",
      "ConsentVerifier",
    ]);
  });

  it("types the stored decision", () => {
    expectTypeOf<ConsentRecord>().toEqualTypeOf<{
      readonly policyVersion: string;
      readonly decidedAt: string;
      readonly categories: Readonly<Record<string, boolean>>;
    }>();
  });

  it("types the verification request and answer", () => {
    expectTypeOf<
      contracts.ConsentVerificationRequest["method"]
    >().toEqualTypeOf<contracts.ConsentVerificationMethod>();
    expectTypeOf<contracts.ConsentVerification>().toEqualTypeOf<{
      readonly verified: boolean;
      readonly reference?: string;
    }>();
    expectTypeOf<contracts.ConsentProof["verificationMethod"]>().toEqualTypeOf<
      contracts.ConsentVerificationMethod | undefined
    >();
  });
});
