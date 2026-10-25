/**
 * Stackra file contract:
 * Purpose: type tests of `HybridPdfRequest`: PDF bytes, XML text and the XMP facts.
 * Boundary: test only; type-level checks with one runtime assertion each.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import type { HybridPdfRequest } from "#contracts/types/hybrid-pdf-request.type";

describe("HybridPdfRequest", () => {
  it("takes bytes and text and refuses a PDF given as text", () => {
    const request: HybridPdfRequest = {
      pdf: new Uint8Array([37]),
      xml: "<x></x>",
      fileName: "invoice.xml",
      conformanceLevel: "LEVEL",
      version: "1.0",
      documentType: "INVOICE",
    };
    // @ts-expect-error -- the PDF is bytes
    const text: HybridPdfRequest = { ...request, pdf: "%PDF" };
    expect([request.pdf.length, text.fileName]).toEqual([1, "invoice.xml"]);
  });
});
