/**
 * Stackra file contract:
 * Purpose: unit tests of `GuardianshipMissingError`: kind `Forbidden`, retryable false, with its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { GuardianshipMissingError } from "#core/errors/guardianship-missing.error";

describe("GuardianshipMissingError", () => {
  it("is a Forbidden refusal", () => {
    const error = GuardianshipMissingError.create();
    expect(isRefusal(error)).toBe(true);
    expect(error.code).toBe("guardianship_missing");
    expect(error.kind).toBe(ErrorKind.Forbidden);
    expect(error.retryable).toBe(false);
    expect(error.details).toEqual({});
  });
});
