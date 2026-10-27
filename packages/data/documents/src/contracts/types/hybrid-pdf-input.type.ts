/**
 * Stackra file contract:
 * Purpose: `HybridPdfInput`, what `PdfAssembler.hybrid` needs to make a hybrid invoice: the printed PDF, the invoice
 *          XML, the attachment name and the XMP facts of the standard (Factur-X, ZUGFeRD, XRechnung).
 * Boundary: a type only, the same shape as fiscal's `HybridPdfRequest` so `HybridPdfBinding` passes it through. The
 *           names and levels are pack options of `@stackra/fiscal`; nothing here names a standard's values.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2); ADR 0364 (decision 6).
 */

/** A printed PDF and the XML to embed in it. */
export interface HybridPdfInput {
  /** The printed invoice PDF. */
  readonly pdf: Uint8Array;

  /** The invoice XML to embed. */
  readonly xml: string;

  /** The embedded file name the standard requires. */
  readonly fileName: string;

  /** The XMP conformance level of the profile (`EN 16931`). */
  readonly conformanceLevel: string;

  /** The XMP version of the standard (`1.0`). */
  readonly version: string;

  /** The XMP document type (`INVOICE`). */
  readonly documentType: string;
}
