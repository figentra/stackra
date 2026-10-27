/**
 * Stackra file contract:
 * Purpose: `HybridPdfBinding`, the binding of `@stackra/fiscal`'s `HybridPdf` port (`fiscal.HybridPdf`) that this
 *          package owns: `attach` hands the request to the bound `PdfAssembler.hybrid`.
 * Boundary: this package does not depend on `@stackra/fiscal` (a data library under a commerce one, and no cycle),
 *           so the class matches the port by shape: the same type-only brand and key and the same `attach`
 *           signature. The host that composes both packages binds it under fiscal's token (a container override).
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 6: documents binds `HybridPdf`); ADR 0365 (decision 2).
 */
import type { PdfAssembler } from "#contracts/ports/pdf-assembler.port";
import type { HybridPdfInput } from "#contracts/types/hybrid-pdf-input.type";

/**
 * Fiscal's `HybridPdf`, made by a `PdfAssembler`.
 *
 * @example
 * const hybrid = new HybridPdfBinding(assembler);
 * const pdf = await hybrid.attach({ pdf, xml, fileName, conformanceLevel, version, documentType });
 */
export class HybridPdfBinding {
  /** Type-only kind brand of a port, so it stands in for fiscal's `HybridPdf`. */
  declare readonly "~kind": "port";

  /** Type-only key of fiscal's `HybridPdf`. */
  declare readonly "~key": "fiscal.HybridPdf";

  /** Makes the hybrid PDF. */
  private readonly assembler: PdfAssembler;

  /**
   * @param assembler - the `PdfAssembler` bound for this deployment.
   */
  constructor(assembler: PdfAssembler) {
    this.assembler = assembler;
  }

  /**
   * The PDF/A-3 bytes with the XML attached.
   *
   * @throws PdfEngineFailedError when the engine cannot be reached or fails.
   */
  attach(request: HybridPdfInput): Promise<Uint8Array> {
    return this.assembler.hybrid(request);
  }
}
