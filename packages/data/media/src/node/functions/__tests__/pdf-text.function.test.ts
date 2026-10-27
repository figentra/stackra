/**
 * Stackra file contract:
 * Purpose: unit tests of `pdfText`: the text layer of each page, pages on their own lines, empty text for a page
 *          without a text layer, and a `RangeError` for bytes that are not a PDF.
 * Boundary: test only; minimal PDFs from `pdf.fixture`, run through the real unpdf.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0234; R3-SO-13.
 */
import { describe, expect, it } from "@stackra/testing";

import { pdfText } from "#node/functions/pdf-text.function";
import { pdf } from "#node/functions/__tests__/pdf.fixture";

describe("pdfText", () => {
  it("reads the text layer of each page, pages on their own lines", async () => {
    expect(await pdfText(pdf(["Invoice 1042", "Total 15.00"]))).toBe("Invoice 1042\nTotal 15.00");
  });

  it("gives empty text for pages without a text layer", async () => {
    expect(await pdfText(pdf([null]))).toBe("");
  });

  it("does not detach the caller's bytes", async () => {
    const bytes = pdf(["Kept"]);
    await pdfText(bytes);
    expect(bytes.byteLength).toBeGreaterThan(0);
  });

  it("refuses bytes that are not a PDF", async () => {
    await expect(pdfText(new TextEncoder().encode("not a pdf"))).rejects.toBeInstanceOf(RangeError);
  });
});
