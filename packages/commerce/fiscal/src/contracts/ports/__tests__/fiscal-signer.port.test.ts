/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalSigner`: an abstract port a host implements; `sign` returns public material only.
 * Boundary: test only; a minimal host driver stands in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0260 (decision 9); ADR 0364.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { SignatureFormat } from "#contracts/enums/signature-format.enum";
import { FiscalSigner } from "#contracts/ports/fiscal-signer.port";
import type { SignatureRequest } from "#contracts/types/signature-request.type";
import type { SignatureResult } from "#contracts/types/signature-result.type";

/** A host signer that signs with the digest. */
class DigestSigner extends FiscalSigner {
  async sign(request: SignatureRequest): Promise<SignatureResult> {
    return {
      value: request.digest,
      signedPayload: null,
      publicKey: null,
      certificateSignature: null,
    };
  }
}

describe("FiscalSigner", () => {
  it("is a port that signs a request", async () => {
    const signer = new DigestSigner();
    expect(signer).toBeInstanceOf(Port);
    const result = await signer.sign({
      unitId: "u",
      format: SignatureFormat.Raw,
      payload: "p",
      digest: "d",
    });
    expect(result.value).toBe("d");
  });
});
