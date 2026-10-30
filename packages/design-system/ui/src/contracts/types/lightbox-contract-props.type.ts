/**
 * Stackra file contract:
 * Purpose: `LightboxContractProps`, the props every runtime's `Lightbox` takes: the pictures, the one in view, and
 *          the open state.
 * Boundary: types only; which picture is in view can be the caller's state or the lightbox's own.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave C: content and media).
 */
import type { GalleryImage } from "#contracts/types/gallery-image.type";
import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";

/** Props shared by the web and native `Lightbox`. */
export interface LightboxContractProps extends OpenStateContractProps {
  /** The pictures, in order. */
  readonly images: readonly GalleryImage[];
  /** The position of the picture in view, for a controlled lightbox; pair it with `onIndexChange`. */
  readonly index?: number | undefined;
  /** The position shown first, for an uncontrolled lightbox. Defaults to 0. */
  readonly defaultIndex?: number | undefined;
  /** Called with the new position each time another picture comes into view. */
  readonly onIndexChange?: ((index: number) => void) | undefined;
  /** The viewer's accessible name, for example "Product photos"; defaults to the catalogue's "Image viewer". */
  readonly label?: string | undefined;
}
