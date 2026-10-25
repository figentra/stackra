/**
 * Stackra file contract:
 * Purpose: unit tests of `HybridPdfFake`: the PDF bytes followed by the XML bytes, and a recorded request.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (decision 2); ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { HybridPdf } from "#contracts/ports/hybrid-pdf.port";
import { HybridPdfFake } from "#testing/hybrid-pdf.fake";

describe("HybridPdfFake", () => {
  it("appends the XML and records", async () => {
    const pdfs = new HybridPdfFake();
    const request = {
      pdf: new Uint8Array([37]),
      xml: "x",
      fileName: "f",
      conformanceLevel: "c",
      version: "v",
      documentType: "d",
    };
    expect(pdfs).toBeInstanceOf(HybridPdf);
    expect([...(await pdfs.attach(request))]).toEqual([37, 120]);
    expect(pdfs.calls("attach")).toEqual([request]);
  });
});
