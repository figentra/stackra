/**
 * Stackra file contract:
 * Purpose: unit tests of `SignatureNotCompleteError`: kind `failed_precondition` (HTTP 412), code `signature_not_complete`, not retryable, with its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0140; ADR 0365.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SignatureNotCompleteError } from "#core/errors/signature-not-complete.error";

describe("SignatureNotCompleteError", () => {
  it("is a failed_precondition refusal carrying its details", () => {
    const error = SignatureNotCompleteError.create({ envelopeId: "env_1", status: "sent" });
    expect(isRefusal(error, SignatureNotCompleteError)).toBe(true);
    expect(Enum.meta(ErrorKind, error.kind).httpStatus).toBe(412);
    expect(error.toEnvelope()).toEqual({
      code: "signature_not_complete",
      category: Enum.meta(ErrorKind, error.kind).category,
      retryable: false,
      details: { envelopeId: "env_1", status: "sent" },
    });
  });
});
