/**
 * Stackra file contract:
 * Purpose: `ImageTransform`, what an `ImageTransformer` makes of an image: the box it fits into, the layers composited
 *          over it, the output format and its quality.
 * Boundary: a type only; the server-side twin of an image variant. A missing side keeps the aspect ratio; the image
 *           is never enlarged. Layers are placed after the resize, in order, the last on top.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 3: image variants); STA-789 (compositing); OS-142.
 */
import type { ImageLayer } from "#contracts/types/image-layer.type";

/** What an `ImageTransformer` makes of an image: box, layers, format and quality. */
export interface ImageTransform {
  /** The widest the output may be, in pixels. */
  readonly width?: number;

  /** The tallest the output may be, in pixels. */
  readonly height?: number;

  /** The images composited over the resized base, in order, the last on top. */
  readonly layers?: readonly ImageLayer[];

  /** The output format: `webp`, `avif`, `jpeg` or `png`. */
  readonly format: "webp" | "avif" | "jpeg" | "png";

  /** The encoder quality, 1 to 100, for a lossy format. */
  readonly quality?: number;
}
