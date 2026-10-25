/**
 * Stackra file contract:
 * Purpose: unit tests of `SignatureEnvelopeClosedError`: kind `conflict` (HTTP 409), code `signature_envelope_closed`, not retryable, with its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0140; ADR 0365.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SignatureEnvelopeClosedError } from "#core/errors/signature-envelope-closed.error";

describe("SignatureEnvelopeClosedError", () => {
  it("is a conflict refusal carrying its details", () => {
    const error = SignatureEnvelopeClosedError.create({ envelopeId: "env_1", status: "signed" });
    expect(isRefusal(error, SignatureEnvelopeClosedError)).toBe(true);
    expect(Enum.meta(ErrorKind, error.kind).httpStatus).toBe(409);
    expect(error.toEnvelope()).toEqual({
      code: "signature_envelope_closed",
      category: Enum.meta(ErrorKind, error.kind).category,
      retryable: false,
      details: { envelopeId: "env_1", status: "signed" },
    });
  });
});
