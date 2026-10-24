/**
 * Stackra file contract:
 * Purpose: unit tests of `VersionSunsetError`: kind `failed_precondition` (HTTP 412), code `version_sunset`, not
 *          retryable, and the version and its sunset day as its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0118 (decision 4 and its enforcement); ADR 0140.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { VersionSunsetError } from "#core/errors/version-sunset.error";

describe("VersionSunsetError", () => {
  it("is a failed precondition carrying the version and its sunset", () => {
    const error = VersionSunsetError.create({ version: "2026-10-01", sunset: "2028-03-01" });
    expect(isRefusal(error, VersionSunsetError)).toBe(true);
    expect(error.kind).toBe(ErrorKind.FailedPrecondition);
    expect(Enum.meta(ErrorKind, error.kind).httpStatus).toBe(412);
    expect(error.toEnvelope()).toEqual({
      code: "version_sunset",
      category: "precondition_failed",
      retryable: false,
      details: { version: "2026-10-01", sunset: "2028-03-01" },
    });
  });
});
