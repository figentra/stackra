/**
 * Stackra file contract:
 * Purpose: unit tests of `LabelDocumentInvalidError`: a non-retryable `internal` refusal, code
 *          `label_document_invalid`, whose details are its fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0328; ADR 0369 (decision 5).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { LabelDocumentInvalidError } from "#core/errors/label-document-invalid.error";

describe("LabelDocumentInvalidError", () => {
  it("is an internal refusal carrying its details", () => {
    const refusal = LabelDocumentInvalidError.create({ format: "pdf", reason: "signature" });
    expect(isRefusal(refusal, LabelDocumentInvalidError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.Internal);
    expect(refusal.code).toBe("label_document_invalid");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ format: "pdf", reason: "signature" });
  });
});
