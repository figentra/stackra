/**
 * Stackra file contract:
 * Purpose: unit tests of `SignatureEnvelopeNotFoundError`: kind `not_found` (HTTP 404), code `signature_envelope_not_found`, not retryable, with its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0140; ADR 0365.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SignatureEnvelopeNotFoundError } from "#core/errors/signature-envelope-not-found.error";

describe("SignatureEnvelopeNotFoundError", () => {
  it("is a not_found refusal carrying its details", () => {
    const error = SignatureEnvelopeNotFoundError.create({ envelopeId: "env_9" });
    expect(isRefusal(error, SignatureEnvelopeNotFoundError)).toBe(true);
    expect(Enum.meta(ErrorKind, error.kind).httpStatus).toBe(404);
    expect(error.toEnvelope()).toEqual({
      code: "signature_envelope_not_found",
      category: Enum.meta(ErrorKind, error.kind).category,
      retryable: false,
      details: { envelopeId: "env_9" },
    });
  });
});
