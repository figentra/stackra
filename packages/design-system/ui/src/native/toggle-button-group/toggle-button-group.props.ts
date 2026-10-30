/**
 * Stackra file contract:
 * Purpose: `ToggleButtonGroupProps`, the props of the native `ToggleButtonGroup` in `toggle-button-group.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ViewProps } from "react-native";
import type { ToggleButtonGroupContractProps } from "#contracts/types/toggle-button-group-contract-props.type";

/** Props of the native ToggleButtonGroup: the shared contract plus the root's own props, passed through. */
export type ToggleButtonGroupProps = ToggleButtonGroupContractProps &
  Omit<ViewProps, keyof ToggleButtonGroupContractProps>;
