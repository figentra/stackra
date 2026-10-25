/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalCredentialMissingError`: a `fiscal_credential_missing` refusal of kind
 *          `FailedPrecondition` whose details are its fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0364.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FiscalCredentialMissingError } from "#core/errors/fiscal-credential-missing.error";

describe("FiscalCredentialMissingError", () => {
  it("carries its kind, code, retry flag and details", () => {
    const refusal = FiscalCredentialMissingError.create({ unitId: "till_1", driver: "rksv" });
    expect(isRefusal(refusal, FiscalCredentialMissingError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.code).toBe("fiscal_credential_missing");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ unitId: "till_1", driver: "rksv" });
  });
});
