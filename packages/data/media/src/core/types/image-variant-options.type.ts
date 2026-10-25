/**
 * Stackra file contract:
 * Purpose: `ImageVariantOptions`, the size and format of one image variant: a bucket's declared `variants` and the
 *          second argument of `useImageVariant`.
 * Boundary: a type only; `checkImageVariant` enforces whole positive pixels and a known format.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 4: image variants).
 */
import type { ImageFormat } from "#core/enums/image-format.enum";

/** One variant's box and format. */
export interface ImageVariantOptions {
  /** The width in CSS pixels, a whole number from 1. */
  readonly width: number;

  /** The height in CSS pixels; absent keeps the aspect ratio. */
  readonly height?: number;

  /** The delivery format; absent keeps the original's. */
  readonly format?: ImageFormat;
}
