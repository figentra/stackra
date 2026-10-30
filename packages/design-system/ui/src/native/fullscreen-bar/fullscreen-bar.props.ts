/**
 * Stackra file contract:
 * Purpose: `FullscreenBarProps`, the props of the native `FullscreenBar` in `fullscreen-bar.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); GAPS.md row 32
 *          (owner decision 2026-10-28).
 */
import type { ViewProps } from "react-native";

import type { FullscreenBarContractProps } from "#contracts/types/fullscreen-bar-contract-props.type";

/**
 * Props of the native FullscreenBar: the shared contract plus the props of its root view, passed through. The
 * children are the bar's own, and its hiding from assistive technology follows its visibility.
 */
export type FullscreenBarProps = FullscreenBarContractProps &
  Omit<
    ViewProps,
    | keyof FullscreenBarContractProps
    | "children"
    | "accessibilityElementsHidden"
    | "importantForAccessibility"
  >;
