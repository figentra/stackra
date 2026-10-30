/**
 * Stackra file contract:
 * Purpose: `TreeViewProps`, the props of the native `TreeView` in `tree-view.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory (2026-10-28) row 22.
 */
import type { ViewProps } from "react-native";
import type { TreeViewContractProps } from "#contracts/types/tree-view-contract-props.type";

/**
 * Props of the native TreeView: the shared contract plus a `View`'s props, passed through to the root. The tree draws
 * its own rows, and `label` owns the accessible name.
 */
export type TreeViewProps = TreeViewContractProps &
  Omit<ViewProps, keyof TreeViewContractProps | "children" | "accessibilityLabel">;
