/**
 * Stackra file contract:
 * Purpose: unit tests of `LicenceIssuerUnavailableError`: kind `unavailable`, code `licence_issuer_unavailable`,
 *          retryable, and the HTTP status is its only detail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0140.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { LicenceIssuerUnavailableError } from "#core/errors/licence-issuer-unavailable.error";

describe("LicenceIssuerUnavailableError", () => {
  it("is a retryable unavailable refusal with the status", () => {
    const error = LicenceIssuerUnavailableError.create({ status: 503 });
    expect(isRefusal(error, LicenceIssuerUnavailableError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.Unavailable);
    expect(error.code).toBe("licence_issuer_unavailable");
    expect(error.retryable).toBe(true);
    expect(error.details).toEqual({ status: 503 });
  });
});
