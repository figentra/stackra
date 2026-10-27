/**
 * Stackra file contract:
 * Purpose: unit tests of `SignatureSignerUnreachableError`: kind `validation` (HTTP 400), code `signature_signer_unreachable`, not retryable, with its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0140; ADR 0365.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SignatureSignerUnreachableError } from "#core/errors/signature-signer-unreachable.error";

describe("SignatureSignerUnreachableError", () => {
  it("is a validation refusal carrying its details", () => {
    const error = SignatureSignerUnreachableError.create({ order: 2 });
    expect(isRefusal(error, SignatureSignerUnreachableError)).toBe(true);
    expect(Enum.meta(ErrorKind, error.kind).httpStatus).toBe(400);
    expect(error.toEnvelope()).toEqual({
      code: "signature_signer_unreachable",
      category: Enum.meta(ErrorKind, error.kind).category,
      retryable: false,
      details: { order: 2 },
    });
  });
});
