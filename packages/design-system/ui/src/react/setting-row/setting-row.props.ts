/**
 * Stackra file contract:
 * Purpose: `SettingRowProps`, the props of the web `SettingRow` in `setting-row.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory row 37.
 */
import type { ComponentPropsWithoutRef } from "react";
import type { SettingRowContractProps } from "#contracts/types/setting-row-contract-props.type";

/** Props of the web SettingRow: the shared contract plus the props of its outer `div`; the row draws its children. */
export type SettingRowProps = SettingRowContractProps &
  Omit<ComponentPropsWithoutRef<"div">, keyof SettingRowContractProps | "children" | "onChange">;
