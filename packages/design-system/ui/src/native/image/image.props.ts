/**
 * Stackra file contract:
 * Purpose: `ImageProps`, the props of the native `Image`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { ImageContractProps } from "#contracts/types/image-contract-props.type";

/** Props of the native Image. */
export type ImageProps = ImageContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
