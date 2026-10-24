/**
 * Stackra file contract:
 * Purpose: unit tests of `UploadRejectedError`: code `upload_rejected`, a validation refusal that is not retryable,
 *          whose envelope names the bucket and the broken rule.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140 (envelope and kinds).
 */
import { ErrorKind } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { UploadRejectedError } from "#core/errors/upload-rejected.error";

describe("UploadRejectedError", () => {
  it("is a validation refusal naming the bucket and the rule", () => {
    const refusal = UploadRejectedError.create({ bucket: "billing.invoices", reason: "size" });
    expect(refusal.kind).toBe(ErrorKind.Validation);
    expect(refusal.toEnvelope()).toEqual({
      code: "upload_rejected",
      category: "validation",
      retryable: false,
      details: { bucket: "billing.invoices", reason: "size" },
    });
  });
});
