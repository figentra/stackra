/**
 * Stackra file contract:
 * Purpose: unit tests of `DocumentValueError`: kind `validation` (HTTP 400), code `document_value`, not retryable, with its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0140; ADR 0365.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { DocumentValueError } from "#core/errors/document-value.error";

describe("DocumentValueError", () => {
  it("is a validation refusal carrying its details", () => {
    const error = DocumentValueError.create({ path: "order.total", reason: "missing" });
    expect(isRefusal(error, DocumentValueError)).toBe(true);
    expect(Enum.meta(ErrorKind, error.kind).httpStatus).toBe(400);
    expect(error.toEnvelope()).toEqual({
      code: "document_value",
      category: Enum.meta(ErrorKind, error.kind).category,
      retryable: false,
      details: { path: "order.total", reason: "missing" },
    });
  });
});
