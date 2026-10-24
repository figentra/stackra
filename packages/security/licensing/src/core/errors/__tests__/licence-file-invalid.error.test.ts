/**
 * Stackra file contract:
 * Purpose: unit tests of `LicenceFileInvalidError`: kind `failed_precondition`, code `licence_file_invalid`, not
 *          retryable, and its `reason` is its only detail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0140.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { LicenceFileInvalidError } from "#core/errors/licence-file-invalid.error";

describe("LicenceFileInvalidError", () => {
  it("is a failed precondition with its reason", () => {
    const error = LicenceFileInvalidError.create({ reason: "bad_signature" });
    expect(isRefusal(error, LicenceFileInvalidError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.FailedPrecondition);
    expect(error.code).toBe("licence_file_invalid");
    expect(error.retryable).toBe(false);
    expect(error.details).toEqual({ reason: "bad_signature" });
  });
});
