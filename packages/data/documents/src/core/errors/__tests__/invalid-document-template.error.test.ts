/**
 * Stackra file contract:
 * Purpose: unit tests of `InvalidDocumentTemplateError`: kind `validation` (HTTP 400), code `invalid_document_template`, not retryable, with its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0140; ADR 0365.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { InvalidDocumentTemplateError } from "#core/errors/invalid-document-template.error";

describe("InvalidDocumentTemplateError", () => {
  it("is a validation refusal carrying its details", () => {
    const error = InvalidDocumentTemplateError.create({
      path: "locales",
      problem: "locale codes repeat",
    });
    expect(isRefusal(error, InvalidDocumentTemplateError)).toBe(true);
    expect(Enum.meta(ErrorKind, error.kind).httpStatus).toBe(400);
    expect(error.toEnvelope()).toEqual({
      code: "invalid_document_template",
      category: Enum.meta(ErrorKind, error.kind).category,
      retryable: false,
      details: { path: "locales", problem: "locale codes repeat" },
    });
  });
});
