/**
 * Stackra file contract:
 * Purpose: unit and type tests of `DocumentFormat`: codes in order and the media type of each.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { DocumentFormat } from "#core/enums/document-format.enum";

describe("DocumentFormat", () => {
  it("holds its codes in order with their media types", () => {
    expect(Enum.values(DocumentFormat)).toEqual(["html", "pdf", "docx"]);
    expect(Enum.meta(DocumentFormat, DocumentFormat.Pdf).mediaType).toBe("application/pdf");
    expect(Enum.meta(DocumentFormat, DocumentFormat.Html).mediaType).toBe(
      "text/html; charset=utf-8",
    );
  });

  it("types its values", () => {
    expectTypeOf<DocumentFormat>().toEqualTypeOf<"html" | "pdf" | "docx">();
  });
});
