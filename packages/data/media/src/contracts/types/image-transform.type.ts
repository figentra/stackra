/**
 * Stackra file contract:
 * Purpose: `ImageTransform`, what an `ImageTransformer` makes of an image: the box it fits into, the output format and
 *          its quality.
 * Boundary: a type only; the server-side twin of an image variant. A missing side keeps the aspect ratio; the image
 *           is never enlarged.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 3: image variants); OS-142.
 */

/** One transform. */
export interface ImageTransform {
  /** The widest the output may be, in pixels. */
  readonly width?: number;

  /** The tallest the output may be, in pixels. */
  readonly height?: number;

  /** The output format: `webp`, `avif`, `jpeg` or `png`. */
  readonly format: "webp" | "avif" | "jpeg" | "png";

  /** The encoder quality, 1 to 100, for a lossy format. */
  readonly quality?: number;
}
