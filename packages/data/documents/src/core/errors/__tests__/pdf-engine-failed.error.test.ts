/**
 * Stackra file contract:
 * Purpose: unit tests of `PdfEngineFailedError`: kind `unavailable` (HTTP 503), code `pdf_engine_failed`, retryable,
 *          with its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0140; ADR 0365.
 */
import { Enum } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { PdfEngineFailedError } from "#core/errors/pdf-engine-failed.error";

describe("PdfEngineFailedError", () => {
  it("is a retryable unavailable refusal carrying its details", () => {
    const error = PdfEngineFailedError.create({ route: "/forms/pdfengines/merge", status: 500 });
    expect(isRefusal(error, PdfEngineFailedError)).toBe(true);
    expect(Enum.meta(ErrorKind, error.kind).httpStatus).toBe(503);
    expect(error.toEnvelope()).toEqual({
      code: "pdf_engine_failed",
      category: Enum.meta(ErrorKind, error.kind).category,
      retryable: true,
      details: { route: "/forms/pdfengines/merge", status: 500 },
    });
  });
});
