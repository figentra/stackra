/**
 * Stackra file contract:
 * Purpose: `ImageVariant`, what `useImageVariant` returns: the URL of the resized image and the box it was asked for,
 *          for the `src`, `width` and `height` of an `<img>`.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 4: image variants).
 */

/** One resized image. */
export interface ImageVariant {
  /** The variant's URL. */
  readonly url: string;

  /** The width it was asked for. */
  readonly width: number;

  /** The height it was asked for; absent when only the width was. */
  readonly height?: number;
}
