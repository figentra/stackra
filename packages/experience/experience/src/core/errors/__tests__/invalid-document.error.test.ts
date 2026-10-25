/**
 * Stackra file contract:
 * Purpose: unit tests of `InvalidDocumentError`: a `Validation` refusal with code `invalid_document` (HTTP 400), not
 *          retryable, naming the path and, when known, the block; the schema's issues stay out of the envelope.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0110 (decision 6); ADR 0140; R-02.
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { InvalidDocumentError } from "#core/errors/invalid-document.error";

describe("InvalidDocumentError", () => {
  it("is a Validation refusal with code invalid_document and the path as details", () => {
    const refused = InvalidDocumentError.create({ path: "2" });
    expect(isRefusal(refused, InvalidDocumentError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.Validation);
    expect(refused.code).toBe("invalid_document");
    expect(refused.retryable).toBe(false);
    expect(refused.details).toEqual({ path: "2" });
  });

  it("keeps the schema's issues as the cause, never in the envelope", () => {
    const cause = new Error("title: expected record");
    const refused = InvalidDocumentError.create({ path: "0", block: "web.cta_banner" }, { cause });
    expect(refused.cause).toBe(cause);
    expect(refused.toEnvelope()).toEqual({
      code: "invalid_document",
      category: "validation",
      retryable: false,
      details: { path: "0", block: "web.cta_banner" },
    });
  });
});
