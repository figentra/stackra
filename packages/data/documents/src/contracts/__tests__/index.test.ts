/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: it exports `PdfEngine`, `ESignatureProvider` and
 *          `SignatureStatus` and no other value, and the types the ports' signatures name resolve.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type {
  PdfPage,
  SignatureEnvelope,
  SignatureRequest,
  SignatureSigner,
} from "#contracts/index";

describe("@stackra/documents/contracts", () => {
  it("exports exactly the ports and the status enum", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "ESignatureProvider",
      "PdfEngine",
      "SignatureStatus",
    ]);
  });

  it("resolves the ports' types", () => {
    expectTypeOf<PdfPage["heightMm"]>().toEqualTypeOf<number | undefined>();
    expectTypeOf<SignatureRequest["signers"]>().toEqualTypeOf<readonly SignatureSigner[]>();
    expectTypeOf<SignatureEnvelope["status"]>().toEqualTypeOf<contracts.SignatureStatus>();
    expectTypeOf<SignatureSigner["order"]>().toEqualTypeOf<number>();
  });
});
