/**
 * Stackra file contract:
 * Purpose: `OverflowListProps`, the props of the native `OverflowList` in `overflow-list.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory (2026-10-28) row 24.
 */
import type { ViewProps } from "react-native";
import type { OverflowListContractProps } from "#contracts/types/overflow-list-contract-props.type";

/**
 * Props of the native OverflowList: the shared contract plus a `View`'s props, passed through to the root. The list
 * draws its own chips, and `label` owns the accessible name.
 */
export type OverflowListProps = OverflowListContractProps &
  Omit<
    ViewProps,
    keyof OverflowListContractProps | "children" | "accessibilityLabel" | "accessibilityRole"
  >;
