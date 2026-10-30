/**
 * Stackra file contract:
 * Purpose: `SegmentedControlProps`, the props of the native `SegmentedControl` in `segmented-control.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ViewProps } from "react-native";
import type { SegmentedControlContractProps } from "#contracts/types/segmented-control-contract-props.type";

/** Props of the native SegmentedControl: the shared contract plus the root's own props, passed through. */
export type SegmentedControlProps = SegmentedControlContractProps &
  Omit<ViewProps, keyof SegmentedControlContractProps>;
