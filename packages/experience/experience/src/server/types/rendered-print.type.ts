/**
 * Stackra file contract:
 * Purpose: `RenderedPrint`, a print document rendered once: the HTML the engine printed and the PDF's bytes.
 * Boundary: a type only. Storing or sending the PDF is the host's job.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 6); ADR 0365 (decision 2).
 */

/** A rendered print document. */
export interface RenderedPrint {
  /** The HTML handed to the engine. */
  readonly html: string;

  /** The PDF file the engine printed from `html`, as raw bytes. */
  readonly pdf: Uint8Array;
}
