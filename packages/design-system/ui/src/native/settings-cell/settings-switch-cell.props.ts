/**
 * Stackra file contract:
 * Purpose: `SettingsSwitchCellProps`, the props of the native `SettingsSwitchCell`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305 (rules 10 to 13).
 */
import type { SettingsSwitchCellContractProps } from "#contracts/types/settings-switch-cell-contract-props.type";

/** Props of the native SettingsSwitchCell. */
export type SettingsSwitchCellProps = SettingsSwitchCellContractProps & {
  /** Styles the cell. */
  readonly className?: string | undefined;
};
