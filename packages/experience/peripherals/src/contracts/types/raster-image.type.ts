/**
 * Stackra file contract:
 * Purpose: `RasterImage`, a 1-bit image a printer prints dot for dot: rows top to bottom, each packed eight dots to a
 *          byte, most significant bit first, a set bit printing black.
 * Boundary: a type only. A row takes `ceil(width / 8)` bytes, so `data` holds `ceil(width / 8) × height` bytes; the
 *           renderer that shaped the text (Arabic included) produced it.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decision 2: Arabic prints as raster).
 */

/** A packed 1-bit image. */
export interface RasterImage {
  /** Width in dots. */
  readonly width: number;

  /** Height in dots. */
  readonly height: number;

  /** The packed rows. */
  readonly data: Uint8Array;
}
