/**
 * Stackra file contract:
 * Purpose: unit tests of `DocumentInvalidError`: a refusal of kind `Validation` with code `document_invalid`
 *          (HTTP 400), not retryable, carrying field errors by path and no details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; R-02.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { DocumentInvalidError } from "#core/errors/document-invalid.error";

describe("DocumentInvalidError", () => {
  it("is a Validation refusal with code document_invalid and field errors", () => {
    const refused = DocumentInvalidError.create(
      {},
      { fieldErrors: { "children.0.id": "id_taken" } },
    );
    expect(isRefusal(refused, DocumentInvalidError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Validation);
    expect(refused.code).toBe("document_invalid");
    expect(refused.retryable).toBe(false);
    expect(refused.details).toEqual({});
    expect(refused.fieldErrors).toEqual({ "children.0.id": "id_taken" });
    expect(Enum.meta(ErrorKind, refused.kind).httpStatus).toBe(400);
  });
});
