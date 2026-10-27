/**
 * Stackra file contract:
 * Purpose: `PdfPage`, the paper a `PdfEngine` prints the HTML onto: the template's page in millimetres.
 * Boundary: a type only. No paper name and no default: the size is the template's data. A missing `heightMm` is a
 *           continuous roll (a receipt), printed as one page as tall as its content.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2).
 */

/** The page a PDF is printed on. */
export interface PdfPage {
  /** The page width. */
  readonly widthMm: number;

  /** The page height; absent for a continuous roll. */
  readonly heightMm?: number | undefined;

  /** The margin on every side. */
  readonly marginMm: number;
}
