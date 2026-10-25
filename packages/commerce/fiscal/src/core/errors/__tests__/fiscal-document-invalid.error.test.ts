/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalDocumentInvalidError`: a `fiscal_document_invalid` refusal of kind `Validation` whose
 *          details are its fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0364.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { FiscalDocumentInvalidError } from "#core/errors/fiscal-document-invalid.error";

describe("FiscalDocumentInvalidError", () => {
  it("carries its kind, code, retry flag and details", () => {
    const refusal = FiscalDocumentInvalidError.create({ driver: "eta", field: "lines.0.itemCode" });
    expect(isRefusal(refusal, FiscalDocumentInvalidError)).toBe(true);
    expect(refusal.kind).toBe(ErrorKind.Validation);
    expect(refusal.code).toBe("fiscal_document_invalid");
    expect(refusal.retryable).toBe(false);
    expect(refusal.details).toEqual({ driver: "eta", field: "lines.0.itemCode" });
  });
});
