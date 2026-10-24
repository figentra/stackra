/**
 * Stackra file contract:
 * Purpose: unit tests of `UnsupportedVersionError`: kind `validation` (HTTP 400), code `unsupported_version`, not
 *          retryable, and the supported dates as its only detail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0118 (decisions 3 and 4); ADR 0140.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { UnsupportedVersionError } from "#core/errors/unsupported-version.error";

describe("UnsupportedVersionError", () => {
  it("is a validation refusal carrying the supported dates", () => {
    const error = UnsupportedVersionError.create({ supported: ["2026-10-01", "2027-03-01"] });
    expect(isRefusal(error, UnsupportedVersionError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.Validation);
    expect(Enum.meta(ErrorKind, error.kind).httpStatus).toBe(400);
    expect(error.toEnvelope()).toEqual({
      code: "unsupported_version",
      category: "validation",
      retryable: false,
      details: { supported: ["2026-10-01", "2027-03-01"] },
    });
  });
});
