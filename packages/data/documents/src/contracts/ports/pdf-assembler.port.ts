/**
 * Stackra file contract:
 * Purpose: the `PdfAssembler` port: works on PDFs that are already printed. It merges several into one file (a batch
 *          of shipping labels) and turns a printed invoice into a hybrid invoice (PDF/A-3 with the invoice XML
 *          embedded and the standard's XMP facts written).
 * Boundary: an abstract class that is its own token, keyed `documents.PdfAssembler`. Which engine runs is a binding
 *           or a Connection (ADR 0356). The XML and the facts are the caller's (`@stackra/fiscal` builds them); this
 *           port only places them. `HybridPdfBinding` adapts it to fiscal's `HybridPdf` port.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2); ADR 0364 (decision 6: the hybrid PDF); ADR 0294 (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";

import type { HybridPdfInput } from "#contracts/types/hybrid-pdf-input.type";

/**
 * Merges PDFs and makes hybrid invoices.
 *
 * @example
 * const labels = await assembler.merge([first, second, third]);
 */
export abstract class PdfAssembler extends Port {
  /** Type-only port key, so `DriverName<PdfAssembler>` narrows to this port's drivers. */
  declare readonly "~key": "documents.PdfAssembler";

  /**
   * One PDF holding the pages of `pdfs`, in the order given.
   *
   * @throws DocumentValueError when `pdfs` is empty.
   * @throws PdfEngineFailedError when the engine cannot be reached or fails.
   */
  abstract merge(pdfs: readonly Uint8Array[]): Promise<Uint8Array>;

  /**
   * The PDF/A-3 of `input.pdf` with `input.xml` embedded and the XMP facts written.
   *
   * @throws PdfEngineFailedError when the engine cannot be reached or fails.
   */
  abstract hybrid(input: HybridPdfInput): Promise<Uint8Array>;
}
