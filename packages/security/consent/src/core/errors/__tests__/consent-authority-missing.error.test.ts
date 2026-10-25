/**
 * Stackra file contract:
 * Purpose: unit tests of `ConsentAuthorityMissingError`: code `consent_authority_missing`, kind `forbidden`, not
 *          retryable, no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; OS-284.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ConsentAuthorityMissingError } from "#core/errors/consent-authority-missing.error";

describe("ConsentAuthorityMissingError", () => {
  it("is a non-retryable forbidden refusal with no details", () => {
    const error = ConsentAuthorityMissingError.create();
    expect(isRefusal(error)).toBe(true);
    expect(error.code).toBe("consent_authority_missing");
    expect(error.kind).toBe(ErrorKind.Forbidden);
    expect(error.retryable).toBe(false);
    expect(error.details).toEqual({});
  });
});
