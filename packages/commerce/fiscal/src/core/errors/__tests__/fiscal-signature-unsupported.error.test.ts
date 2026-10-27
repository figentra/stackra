/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalSignatureUnsupportedError`: its kind, code, retry flag and details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FiscalSignatureUnsupportedError } from "#core/errors/fiscal-signature-unsupported.error";

describe("FiscalSignatureUnsupportedError", () => {
  it("carries its kind, code, retry flag and details", () => {
    const refusal = FiscalSignatureUnsupportedError.create({ unitId: "till_1", format: "cades" });
    expect(isRefusal(refusal, FiscalSignatureUnsupportedError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.code).toBe("fiscal_signature_unsupported");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ unitId: "till_1", format: "cades" });
  });
});
