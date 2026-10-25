/**
 * Stackra file contract:
 * Purpose: `QrMatrix`, an encoded QR code: a square of dark (`true`) and light modules, quiet zone included.
 * Boundary: a type only; drawn as SVG in HTML and as a PNG in DOCX.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2).
 */

/** The modules of a QR code, row by row. */
export type QrMatrix = readonly (readonly boolean[])[];
