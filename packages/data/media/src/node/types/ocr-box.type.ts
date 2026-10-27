/**
 * Stackra file contract:
 * Purpose: `OcrBox`, one recognised text box of an OCR result: `[xMin, yMin, xMax, yMax]` in pixels (PaddleOCR's
 *          `rec_boxes`).
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0192; STA-789.
 */

/** A recognised box: `[xMin, yMin, xMax, yMax]`. */
export type OcrBox = readonly [number, number, number, number];
