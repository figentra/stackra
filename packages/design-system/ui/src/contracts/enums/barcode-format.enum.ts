/**
 * Stackra file contract:
 * Purpose: `BarcodeFormat`, the linear barcodes `Barcode` draws: `code128` (any printable ASCII text) and `ean13`
 *          (retail product numbers).
 * Boundary: values only; the encoders are `code128CodesOf` and `ean13ModulesOf` in core.
 * Runtime: isomorphic
 * Governing contract: ISO/IEC 15417 (Code 128); ISO/IEC 15420 (EAN-13); STA-1371 (wave D, owner approval 2026-10-30).
 */

/** The barcode formats `Barcode` can draw. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the formats carry no labels.
export const BarcodeFormat = Object.freeze(["code128", "ean13"] as const);

/** One barcode format. */
export type BarcodeFormat = (typeof BarcodeFormat)[number];
