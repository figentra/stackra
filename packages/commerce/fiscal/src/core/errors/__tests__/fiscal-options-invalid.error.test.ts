/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalOptionsInvalidError`: a `fiscal_options_invalid` refusal of kind `FailedPrecondition`
 *          whose details are its fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0364.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FiscalOptionsInvalidError } from "#core/errors/fiscal-options-invalid.error";

describe("FiscalOptionsInvalidError", () => {
  it("carries its kind, code, retry flag and details", () => {
    const refusal = FiscalOptionsInvalidError.create({
      driver: "peppol",
      issues: "accessPointUrl: Invalid URL",
    });
    expect(isRefusal(refusal, FiscalOptionsInvalidError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.code).toBe("fiscal_options_invalid");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ driver: "peppol", issues: "accessPointUrl: Invalid URL" });
  });
});
