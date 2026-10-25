/**
 * Stackra file contract:
 * Purpose: `encodeQr`, the module matrix of a QR code for a text, with the four-module quiet zone the QR standard
 *          asks for.
 * Boundary: encodes only; what the text holds (a tax QR payload, a verify URL, a ticket code) is built by its owner
 *           (`@stackra/fiscal`, achievements). Encoding is `uqr`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2).
 */
import { encode } from "uqr";

import type { QrMatrix } from "#core/types/qr-matrix.type";

/** The quiet zone, in modules, ISO/IEC 18004 asks for around a symbol. */
const QUIET_ZONE = 4;

/**
 * The matrix of `text` at the error-correction level `errorCorrection`.
 *
 * @example
 * encodeQr("https://verify.example/abc", "M").length; // the side, quiet zone included
 */
export function encodeQr(text: string, errorCorrection: "L" | "M" | "Q" | "H"): QrMatrix {
  return encode(text, { ecc: errorCorrection, border: QUIET_ZONE }).data;
}
