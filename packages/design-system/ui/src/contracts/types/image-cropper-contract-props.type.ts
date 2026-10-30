/**
 * Stackra file contract:
 * Purpose: `ImageCropperContractProps`, the props every runtime's `ImageCropper` takes: the image, the frame's shape,
 *          the zoom range and the crop it reports.
 * Boundary: types only; the cropper reports a rectangle and never cuts the file itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave C: content and media).
 */
import type { ImageCrop } from "#contracts/types/image-crop.type";

/** Props shared by the web and native `ImageCropper`. */
export interface ImageCropperContractProps {
  /** The image to crop. */
  readonly src: string;
  /** The cropper's accessible name, for example "Crop your profile photo"; defaults to the catalogue's "Crop image". */
  readonly label?: string | undefined;
  /** The frame's width over its height. Defaults to 1, a square. */
  readonly aspectRatio?: number | undefined;
  /** `rect`, or `round` for an avatar (the crop is still the square around the circle). Defaults to `rect`. */
  readonly shape?: "rect" | "round" | undefined;
  /** The largest zoom, as a multiple of the image just covering the frame. Defaults to 3. */
  readonly maxZoom?: number | undefined;
  /** Called with the kept rectangle, in the image's pixels, after each move or zoom. */
  readonly onCropChange?: ((crop: ImageCrop) => void) | undefined;
}
