/**
 * Stackra file contract:
 * Purpose: `HybridPdfRequest`, what `HybridPdf.attach` needs to turn a rendered PDF into a hybrid invoice: the PDF,
 *          the invoice XML, the attachment name and the XMP facts.
 * Boundary: a type only; the names and levels come from pack options.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 6).
 */

/** A PDF and the XML to embed in it. */
export type HybridPdfRequest = {
  /** The rendered invoice PDF. */
  readonly pdf: Uint8Array;
  /** The invoice XML to embed. */
  readonly xml: string;
  /** The embedded file name the standard requires. */
  readonly fileName: string;
  /** The XMP conformance level of the profile. */
  readonly conformanceLevel: string;
  /** The XMP version of the standard. */
  readonly version: string;
  /** The XMP document type. */
  readonly documentType: string;
};
