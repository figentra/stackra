/**
 * Stackra file contract:
 * Purpose: `GalleryContractProps`, the props every runtime's `Gallery` takes: the pictures, a square grid or a masonry
 *          of their own shapes, the column count, and whether a press opens them in the Lightbox.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave C: content and media).
 */
import type { GalleryImage } from "#contracts/types/gallery-image.type";

/** Props shared by the web and native `Gallery`. */
export interface GalleryContractProps {
  /** The pictures, in order. */
  readonly images: readonly GalleryImage[];
  /** The gallery's accessible name, for example "Product photos". */
  readonly label: string;
  /** `grid`: square tiles in rows. `masonry`: each picture at its own shape, in columns. Defaults to `grid`. */
  readonly layout?: "grid" | "masonry" | undefined;
  /** The number of columns; defaults to 3 (2 on a narrow web screen). */
  readonly columns?: number | undefined;
  /** True (the default): pressing a picture opens it in the Lightbox. */
  readonly hasLightbox?: boolean | undefined;
  /** Called with a picture's id when it is pressed, after the lightbox opens. */
  readonly onImagePress?: ((id: string) => void) | undefined;
}
