/**
 * Stackra file contract:
 * Purpose: unit tests of `UploadBucketMismatchError`: code `upload_bucket_mismatch`, a validation refusal that is not
 *          retryable, whose envelope names the bucket claimed for.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140 (envelope and kinds).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { UploadBucketMismatchError } from "#core/errors/upload-bucket-mismatch.error";

describe("UploadBucketMismatchError", () => {
  it("is a validation refusal naming the bucket", () => {
    const refusal = UploadBucketMismatchError.create({ bucket: "catalogue.product_images" });
    expect(isRefusal(refusal)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.Validation);
    expect(refusal.toEnvelope()).toEqual({
      code: "upload_bucket_mismatch",
      category: "validation",
      retryable: false,
      details: { bucket: "catalogue.product_images" },
    });
  });
});
