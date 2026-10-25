/**
 * Stackra file contract:
 * Purpose: type tests of `SignatureResult`: a detached signature with nullable public material.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import type { SignatureResult } from "#contracts/types/signature-result.type";

describe("SignatureResult", () => {
  it("takes a detached signature and refuses a missing value", () => {
    const result: SignatureResult = {
      value: "v",
      signedPayload: null,
      publicKey: null,
      certificateSignature: null,
    };
    // @ts-expect-error -- every result has a value
    const empty: SignatureResult = {
      signedPayload: null,
      publicKey: null,
      certificateSignature: null,
    };
    expect([result.value, empty.publicKey]).toEqual(["v", null]);
  });
});
