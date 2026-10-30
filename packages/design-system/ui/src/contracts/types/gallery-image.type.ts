/**
 * Stackra file contract:
 * Purpose: `GalleryImage`, one picture of a Gallery or a Lightbox: its source, its words and, for a masonry layout,
 *          its size.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave C: content and media).
 */

/** One picture of a gallery or a lightbox. */
export interface GalleryImage {
  /** Unique within the gallery. */
  readonly id: string;
  /** The full-size image. */
  readonly src: string;
  /** What the picture shows; it is the image's accessible name. */
  readonly alt: string;
  /** A smaller copy for the grid and the thumbnail strip; defaults to `src`. */
  readonly thumbnailSrc?: string | undefined;
  /** A line shown under the picture in the lightbox. */
  readonly caption?: string | undefined;
  /** The width in pixels; with `height`, it keeps the picture's shape in a masonry layout before it loads. */
  readonly width?: number | undefined;
  /** The height in pixels. */
  readonly height?: number | undefined;
}
