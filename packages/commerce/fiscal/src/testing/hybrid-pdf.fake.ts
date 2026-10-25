/**
 * Stackra file contract:
 * Purpose: `HybridPdfFake`, a `HybridPdf` that appends the XML's bytes to the PDF's and records every request.
 * Boundary: built on `Fake` of @stackra/testing; the output is not a PDF/A-3, only proof the XML was handed over.
 * Runtime: isomorphic
 * Governing contract: ADR 0269; ADR 0266 (decision 2); ADR 0364.
 */
import { Fake } from "@stackra/testing";

import { HybridPdf } from "#contracts/ports/hybrid-pdf.port";
import type { HybridPdfRequest } from "#contracts/types/hybrid-pdf-request.type";

/**
 * Concatenates.
 *
 * @example
 * const pdfs = new HybridPdfFake();
 */
export class HybridPdfFake extends Fake.of(HybridPdf) {
  /** Recorded, then the PDF bytes followed by the XML bytes. */
  async attach(request: HybridPdfRequest): Promise<Uint8Array> {
    this.record("attach", request);
    const xml = new TextEncoder().encode(request.xml);
    const out = new Uint8Array(request.pdf.length + xml.length);
    out.set(request.pdf);
    out.set(xml, request.pdf.length);
    return out;
  }
}
