/**
 * Stackra file contract:
 * Purpose: unit tests of `EdgeSignatureInvalidError`: an unauthenticated, non-retryable refusal coded
 *          `edge_signature_invalid`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0437.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { EdgeSignatureInvalidError } from "#server/errors/edge-signature-invalid.error";

describe("EdgeSignatureInvalidError", () => {
  it("is an unauthenticated refusal coded edge_signature_invalid", () => {
    const error = EdgeSignatureInvalidError.create();
    expect(isRefusal(error, EdgeSignatureInvalidError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.Unauthenticated);
    expect(error.code).toBe("edge_signature_invalid");
    expect(error.retryable).toBe(false);
  });
});
