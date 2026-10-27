/**
 * Stackra file contract:
 * Purpose: `FiscalSignerFake`, a deterministic `FiscalSigner`: the signature is base64url SHA-256 of the unit and the
 *          payload, an XAdES request gets its payload back as the signed document, and fixed public material.
 * Boundary: built on `Fake` of @stackra/testing; no key, so tests check what was asked and that output is stable,
 *           never cryptographic validity.
 * Runtime: isomorphic
 * Governing contract: ADR 0269; ADR 0266 (decision 2); ADR 0364.
 */
import { Fake } from "@stackra/testing";

import { SignatureFormat } from "#contracts/enums/signature-format.enum";
import { FiscalSigner } from "#contracts/ports/fiscal-signer.port";
import type { SignatureRequest } from "#contracts/types/signature-request.type";
import type { SignatureResult } from "#contracts/types/signature-result.type";
import { sha256 } from "#core/functions/sha256.function";
import { toBase64 } from "#core/functions/to-base64.function";
import { toBase64Url } from "#core/functions/to-base64-url.function";

/**
 * A `FiscalSigner` fake that signs deterministically and records its calls.
 *
 * @example
 * const signer = new FiscalSignerFake();
 * signer.calls("sign"); // every SignatureRequest
 */
export class FiscalSignerFake extends Fake.of(FiscalSigner) {
  /** Recorded, then a stable signature. */
  async sign(request: SignatureRequest): Promise<SignatureResult> {
    this.record("sign", request);
    return {
      value: toBase64Url(await sha256(`${request.unitId}|${request.payload}`)),
      signedPayload: request.format === SignatureFormat.Xades ? request.payload : null,
      publicKey: toBase64("public-key"),
      certificateSignature: toBase64("certificate-signature"),
    };
  }
}
