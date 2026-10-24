/**
 * Stackra file contract:
 * Purpose: unit tests of `UploadExpiredError`: code `upload_expired`, a failed precondition that is not retryable and
 *          carries no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140 (envelope and kinds).
 */
import { ErrorKind } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { UploadExpiredError } from "#core/errors/upload-expired.error";

describe("UploadExpiredError", () => {
  it("is a failed precondition with no details", () => {
    const refusal = UploadExpiredError.create();
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.toEnvelope()).toEqual({
      code: "upload_expired",
      category: "precondition_failed",
      retryable: false,
    });
  });
});
