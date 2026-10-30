/**
 * Stackra file contract:
 * Purpose: `SettingRowProps`, the props of the native `SettingRow` in `setting-row.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory row 37.
 */
import type { ViewProps } from "react-native";
import type { SettingRowContractProps } from "#contracts/types/setting-row-contract-props.type";

/** Props of the native SettingRow: the shared contract plus the props of its outer `View`; the row draws its children. */
export type SettingRowProps = SettingRowContractProps &
  Omit<ViewProps, keyof SettingRowContractProps | "children">;
