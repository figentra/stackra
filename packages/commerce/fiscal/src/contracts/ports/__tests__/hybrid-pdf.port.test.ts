/**
 * Stackra file contract:
 * Purpose: unit tests of `HybridPdf`: an abstract port a host implements; `attach` returns PDF bytes.
 * Boundary: test only; a minimal host driver stands in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0260 (decision 9); ADR 0364.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { HybridPdf } from "#contracts/ports/hybrid-pdf.port";
import type { HybridPdfRequest } from "#contracts/types/hybrid-pdf-request.type";

/** A host binding that returns the PDF unchanged. */
class Passthrough extends HybridPdf {
  async attach(request: HybridPdfRequest): Promise<Uint8Array> {
    return request.pdf;
  }
}

describe("HybridPdf", () => {
  it("is a port that returns the hybrid bytes", async () => {
    const pdfs = new Passthrough();
    const pdf = new Uint8Array([1]);
    expect(pdfs).toBeInstanceOf(Port);
    expect(
      await pdfs.attach({
        pdf,
        xml: "",
        fileName: "f",
        conformanceLevel: "c",
        version: "v",
        documentType: "d",
      }),
    ).toBe(pdf);
  });
});
