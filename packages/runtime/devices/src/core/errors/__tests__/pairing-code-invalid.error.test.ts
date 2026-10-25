/**
 * Stackra file contract:
 * Purpose: unit tests of `PairingCodeInvalidError`: a `not_found` refusal coded `pairing_code_invalid`, not
 *          retryable, with no detail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140; ADR 0361 (decision 7).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { PairingCodeInvalidError } from "#core/errors/pairing-code-invalid.error";

describe("PairingCodeInvalidError", () => {
  it("is a not-found refusal with no detail", () => {
    const error = PairingCodeInvalidError.create();
    expect(isRefusal(error, PairingCodeInvalidError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.NotFound);
    expect(error.code).toBe("pairing_code_invalid");
    expect(error.retryable).toBe(false);
  });
});
