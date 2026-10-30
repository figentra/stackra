/**
 * Stackra file contract:
 * Purpose: `CropGeometry`, where an ImageCropper draws its image inside the frame and what it keeps, worked out by
 *          `cropGeometryOf`. Lengths are in frame widths, so the web draws them as percentages and native multiplies by
 *          the measured width.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave C: content and media).
 */
import type { ImageCrop } from "#contracts/types/image-crop.type";

/** The drawn image and the kept rectangle. */
export interface CropGeometry {
  /** The frame's height in frame widths (1 / aspect ratio). */
  readonly frameHeight: number;
  /** The drawn image's width in frame widths. */
  readonly width: number;
  /** The drawn image's height in frame widths. */
  readonly height: number;
  /** The image's left edge from the frame's left edge, in frame widths (0 or less). */
  readonly left: number;
  /** The image's top edge from the frame's top edge, in frame widths (0 or less). */
  readonly top: number;
  /** The offset after clamping, so the image always covers the frame. */
  readonly offset: { readonly x: number; readonly y: number };
  /** The kept rectangle in the image's own pixels. */
  readonly crop: ImageCrop;
}
