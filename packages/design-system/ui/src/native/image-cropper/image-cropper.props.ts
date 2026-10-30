/**
 * Stackra file contract:
 * Purpose: `ImageCropperProps`, the props of the native `ImageCropper`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { ImageCropperContractProps } from "#contracts/types/image-cropper-contract-props.type";

/** Props of the native ImageCropper. */
export type ImageCropperProps = ImageCropperContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
