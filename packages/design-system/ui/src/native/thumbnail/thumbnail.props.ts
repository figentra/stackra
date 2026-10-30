/**
 * Stackra file contract:
 * Purpose: `ThumbnailProps`, the props of the native `Thumbnail` in `thumbnail.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory row 12.
 */
import type { ViewProps } from "react-native";
import type { ThumbnailContractProps } from "#contracts/types/thumbnail-contract-props.type";

/**
 * Props of the native Thumbnail: the shared contract plus the root `View`'s own props, passed through. The wrapper
 * draws the children and `alt` owns the accessible name, so the raw accessibility props are refused.
 */
export type ThumbnailProps = ThumbnailContractProps &
  Omit<
    ViewProps,
    | keyof ThumbnailContractProps
    | "children"
    | "accessible"
    | "role"
    | "accessibilityRole"
    | "accessibilityLabel"
    | "accessibilityElementsHidden"
    | "importantForAccessibility"
  >;
