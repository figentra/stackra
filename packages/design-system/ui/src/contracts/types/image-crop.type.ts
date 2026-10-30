/**
 * Stackra file contract:
 * Purpose: `ImageCrop`, the part of an image an ImageCropper keeps, in the image's own pixels, ready for a server or
 *          a canvas to cut.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave C: content and media).
 */

/** A rectangle in the image's natural pixels, from its top-left corner. */
export interface ImageCrop {
  /** Pixels from the image's left edge. */
  readonly x: number;
  /** Pixels from the image's top edge. */
  readonly y: number;
  /** The width kept. */
  readonly width: number;
  /** The height kept. */
  readonly height: number;
}
