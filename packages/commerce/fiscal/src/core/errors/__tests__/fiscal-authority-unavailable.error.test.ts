/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalAuthorityUnavailableError`: a `fiscal_authority_unavailable` refusal of kind
 *          `Unavailable` whose details are its fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0364.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FiscalAuthorityUnavailableError } from "#core/errors/fiscal-authority-unavailable.error";

describe("FiscalAuthorityUnavailableError", () => {
  it("carries its kind, code, retry flag and details", () => {
    const refusal = FiscalAuthorityUnavailableError.create({ driver: "zatca", status: 503 });
    expect(isRefusal(refusal, FiscalAuthorityUnavailableError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.Unavailable);
    expect(refusal.code).toBe("fiscal_authority_unavailable");
    expect(refusal.retryable).toBe(true);
    expect(refusal.details).toEqual({ driver: "zatca", status: 503 });
  });
});
