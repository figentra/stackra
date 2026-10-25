/**
 * Stackra file contract:
 * Purpose: `HybridPdf`, the port that makes a hybrid invoice: it embeds the invoice XML in a PDF/A-3 with the XMP
 *          facts of the standard.
 * Boundary: an abstract class that is its own token, key `fiscal.HybridPdf`. `@stackra/documents` owns PDF rendering
 *           and binds it; this package builds the XML and names the facts. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 6).
 */
import { Port } from "@stackra/contracts";

import type { HybridPdfRequest } from "#contracts/types/hybrid-pdf-request.type";

/**
 * Embeds an invoice XML in a rendered PDF.
 *
 * @example
 * const hybrid = await pdfs.attach({ pdf, xml, fileName, conformanceLevel, version, documentType });
 */
export abstract class HybridPdf extends Port {
  /** Type-only port key. */
  declare readonly "~key": "fiscal.HybridPdf";

  /** The PDF/A-3 bytes with the XML attached. */
  abstract attach(request: HybridPdfRequest): Promise<Uint8Array>;
}
