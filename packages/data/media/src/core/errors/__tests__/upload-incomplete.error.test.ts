/**
 * Stackra file contract:
 * Purpose: unit tests of `UploadIncompleteError`: code `upload_incomplete`, a failed precondition that is not retryable
 *          and carries no details, so a guessed id learns nothing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140 (envelope and kinds).
 */
import { ErrorKind } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { UploadIncompleteError } from "#core/errors/upload-incomplete.error";

describe("UploadIncompleteError", () => {
  it("is a failed precondition with no details", () => {
    const refusal = UploadIncompleteError.create();
    expect(refusal.kind).toBe(ErrorKind.FailedPrecondition);
    expect(refusal.toEnvelope()).toEqual({
      code: "upload_incomplete",
      category: "precondition_failed",
      retryable: false,
    });
  });
});
