/**
 * Stackra file contract:
 * Purpose: `GalleryProps`, the props of the web `Gallery`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { GalleryContractProps } from "#contracts/types/gallery-contract-props.type";

/** Props of the web Gallery. */
export type GalleryProps = GalleryContractProps & {
  /** Styles the list. */
  readonly className?: string | undefined;
};
