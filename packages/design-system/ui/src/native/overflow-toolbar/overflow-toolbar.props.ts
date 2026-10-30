/**
 * Stackra file contract:
 * Purpose: `OverflowToolbarProps`, the props of the native `OverflowToolbar` in `overflow-toolbar.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0312.
 */
import type { ViewProps } from "react-native";
import type { OverflowToolbarContractProps } from "#contracts/types/overflow-toolbar-contract-props.type";

/**
 * Props of the native OverflowToolbar: the shared contract plus the row `View`'s own props, passed through. The
 * buttons are the component's, so `children` is refused, and `label` names the toolbar, so `accessibilityLabel` is too.
 */
export type OverflowToolbarProps = OverflowToolbarContractProps &
  Omit<ViewProps, keyof OverflowToolbarContractProps | "children" | "accessibilityLabel">;
