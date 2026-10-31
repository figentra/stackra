/**
 * Stackra file contract:
 * Purpose: `ImageContractProps`, the props every runtime's `Image` takes: a picture that fills its container's width
 *          at an aspect ratio, with the Thumbnail's blur-up placeholder and icon fallback, an optional caption, and an
 *          optional press that opens it full size in the Lightbox.
 * Boundary: types only. The loading, placeholder and fallback are Thumbnail's; Image only sizes it fluidly.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (gap build, owner approval 2026-10-31).
 */
import type { ThumbnailContractProps } from "#contracts/types/thumbnail-contract-props.type";

/** Props shared by the web and native `Image`. */
export interface ImageContractProps extends Omit<ThumbnailContractProps, "size" | "aspectRatio"> {
  /** Width over height; defaults to 16 / 9. */
  readonly aspectRatio?: number | undefined;
  /** A line under the picture. */
  readonly caption?: string | undefined;
  /** True to open the picture full size in the Lightbox on a press; needs `src` and `alt`. */
  readonly isZoomable?: boolean | undefined;
}
