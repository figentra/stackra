/**
 * Stackra file contract:
 * Purpose: `GotenbergPdfAssemblerDriver`, the `gotenberg` driver of `PdfAssembler`: merges PDFs
 *          (`POST /forms/pdfengines/merge`) and makes hybrid invoices (`POST /forms/pdfengines/factur-x`, which
 *          embeds the XML, writes the Factur-X XMP facts and converts to PDF/A-3b).
 * Boundary: plain `fetch`, no SDK. Gotenberg merges files in alphanumeric name order, so each PDF is sent as a
 *           zero-padded index (`000001.pdf`) to keep the caller's order. One PDF is answered as it is, without a
 *           call. Gotenberg names the embedded XML itself (`factur-x.xml`, or `xrechnung.xml` for the XRECHNUNG
 *           level), so `HybridPdfInput.fileName` is only the upload's name.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2); ADR 0364 (decision 6); ADR 0266 (one option, one driver).
 */
import { Driver } from "@stackra/container";

import { PdfAssembler } from "#contracts/ports/pdf-assembler.port";
import type { HybridPdfInput } from "#contracts/types/hybrid-pdf-input.type";
import { DocumentValueError } from "#core/errors/document-value.error";
import { postGotenbergForm } from "#core/functions/post-gotenberg-form.function";
import type { GotenbergEndpoint } from "#core/types/gotenberg-endpoint.type";

/** `bytes` as a PDF file part (copied, so a shared buffer is never sent). */
function pdfBlob(bytes: Uint8Array): Blob {
  return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
}

/**
 * Merges PDFs and makes hybrid invoices through Gotenberg.
 *
 * @example
 * const assembler = new GotenbergPdfAssemblerDriver({ url: "http://gotenberg:3000", timeoutMs: 30_000 });
 * const labels = await assembler.merge(labelPdfs);
 */
export class GotenbergPdfAssemblerDriver extends Driver(PdfAssembler) {
  /** Where the engine runs. */
  private readonly endpoint: GotenbergEndpoint;

  /**
   * @param endpoint - the engine's URL, timeout and headers (from the Connection).
   */
  constructor(endpoint: GotenbergEndpoint) {
    super();
    this.endpoint = endpoint;
  }

  /**
   * One PDF holding the pages of `pdfs`, in the order given.
   *
   * @throws DocumentValueError when `pdfs` is empty.
   * @throws PdfEngineFailedError when the engine cannot be reached or fails.
   */
  merge(pdfs: readonly Uint8Array[]): Promise<Uint8Array> {
    const [first] = pdfs;
    if (first === undefined)
      return Promise.reject(DocumentValueError.create({ path: "pdfs", reason: "missing" }));
    if (pdfs.length === 1) return Promise.resolve(first);
    const form = new FormData();
    pdfs.forEach((pdf, index) =>
      form.append("files", pdfBlob(pdf), `${String(index + 1).padStart(6, "0")}.pdf`),
    );
    return postGotenbergForm(this.endpoint, "/forms/pdfengines/merge", form);
  }

  /**
   * The PDF/A-3b of `input.pdf` with `input.xml` embedded and the Factur-X XMP facts written.
   *
   * @throws PdfEngineFailedError when the engine cannot be reached or fails.
   */
  hybrid(input: HybridPdfInput): Promise<Uint8Array> {
    const form = new FormData();
    form.append("files", pdfBlob(input.pdf), "invoice.pdf");
    form.append("facturxXml", new Blob([input.xml], { type: "text/xml" }), input.fileName);
    form.append("facturxConformanceLevel", input.conformanceLevel);
    form.append("facturxDocumentType", input.documentType);
    form.append("facturxVersion", input.version);
    form.append("pdfa", "PDF/A-3b");
    return postGotenbergForm(this.endpoint, "/forms/pdfengines/factur-x", form);
  }
}
