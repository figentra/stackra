/**
 * Stackra file contract:
 * Purpose: unit tests of `UploadFailedError`: code `upload_failed`, an unavailable refusal that is retryable by its
 *          kind, whose envelope carries the status and the service's refusal code without clashing with its own code.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140 (envelope and kinds).
 */
import { ErrorKind } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { UploadFailedError } from "#core/errors/upload-failed.error";

describe("UploadFailedError", () => {
  it("is an unavailable refusal carrying the status and the service's code", () => {
    const refusal = UploadFailedError.create({ status: 400, serviceCode: "upload_rejected" });
    expect(refusal.kind).toBe(ErrorKind.Unavailable);
    expect(refusal.code).toBe("upload_failed");
    expect(refusal.toEnvelope()).toEqual({
      code: "upload_failed",
      category: "unavailable",
      retryable: true,
      details: { status: 400, serviceCode: "upload_rejected" },
    });
  });
});
