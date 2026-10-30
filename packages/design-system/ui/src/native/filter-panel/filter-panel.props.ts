/**
 * Stackra file contract:
 * Purpose: `FilterPanelProps`, the props of the native `FilterPanel` in `filter-panel.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0318;
 *          design-system gap inventory (2026-10-28) row 9.
 */
import type { ViewProps } from "react-native";
import type { FilterPanelContractProps } from "#contracts/types/filter-panel-contract-props.type";

/**
 * Props of the native FilterPanel: the shared contract plus a `View`'s props, passed through to the root. The panel
 * draws its own content, and `label` owns the accessible name.
 */
export type FilterPanelProps = FilterPanelContractProps &
  Omit<ViewProps, keyof FilterPanelContractProps | "children" | "accessibilityLabel">;
