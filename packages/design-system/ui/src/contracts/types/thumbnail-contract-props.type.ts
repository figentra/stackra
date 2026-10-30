/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Thumbnail` takes: the image, a blurred low-resolution placeholder, the
 *          accessible name, the size, the aspect ratio, how the image fits and the fallback icon.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); design-system gap inventory row 12; WCAG 2.2
 *          SC 1.1.1.
 */
import type { Size } from "#contracts/enums/size.enum";
import type { IconSlot } from "#contracts/types/icon-slot.type";

/** Props shared by the web and native `Thumbnail`. */
export interface ThumbnailContractProps {
  /** The image URL; the fallback icon shows while it is missing or after it fails to load. */
  readonly src?: string | undefined;
  /** A tiny image (a few pixels wide) drawn blurred until `src` loads, then faded out. */
  readonly placeholderSrc?: string | undefined;
  /** The accessible name; without it the thumbnail is decorative and hidden from assistive technology. */
  readonly alt?: string | undefined;
  /** The width: `sm` 40, `md` 64, `lg` 96 points. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** Width over height. Defaults to 1, a square. */
  readonly aspectRatio?: number | undefined;
  /** `cover` crops to fill the box, `contain` letterboxes the whole image. Defaults to `cover`. */
  readonly fit?: "cover" | "contain" | undefined;
  /** The icon drawn with no image or a broken one. Defaults to the image icon, or the broken-image icon after an error. */
  readonly fallback?: IconSlot | undefined;
}
