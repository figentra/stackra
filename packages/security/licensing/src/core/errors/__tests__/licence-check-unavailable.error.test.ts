/**
 * Stackra file contract:
 * Purpose: unit tests of `LicenceCheckUnavailableError`: kind `unavailable`, code `licence_check_unavailable`,
 *          retryable, and the HTTP status is its only detail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0140.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { LicenceCheckUnavailableError } from "#core/errors/licence-check-unavailable.error";

describe("LicenceCheckUnavailableError", () => {
  it("is a retryable unavailable refusal with the status", () => {
    const error = LicenceCheckUnavailableError.create({ status: 502 });
    expect(isRefusal(error, LicenceCheckUnavailableError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.Unavailable);
    expect(error.code).toBe("licence_check_unavailable");
    expect(error.retryable).toBe(true);
    expect(error.details).toEqual({ status: 502 });
  });
});
