/**
 * Stackra file contract:
 * Purpose: unit tests of `ConsentNotVerifiedError`: code `consent_not_verified`, kind `forbidden`, not
 *          retryable, no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; STA-1323.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ConsentNotVerifiedError } from "#core/errors/consent-not-verified.error";

describe("ConsentNotVerifiedError", () => {
  it("is a non-retryable forbidden refusal with no details", () => {
    const error = ConsentNotVerifiedError.create();
    expect(isRefusal(error)).toBe(true);
    expect(error.code).toBe("consent_not_verified");
    expect(error.kind).toBe(ErrorKind.Forbidden);
    expect(error.retryable).toBe(false);
    expect(error.details).toEqual({});
  });
});
