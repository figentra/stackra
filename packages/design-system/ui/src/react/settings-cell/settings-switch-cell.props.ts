/**
 * Stackra file contract:
 * Purpose: `SettingsSwitchCellProps`, the props of the web `SettingsSwitchCell`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305 (rules 10 to 13).
 */
import type { SettingsSwitchCellContractProps } from "#contracts/types/settings-switch-cell-contract-props.type";

/** Props of the web SettingsSwitchCell. */
export type SettingsSwitchCellProps = SettingsSwitchCellContractProps & {
  /** Styles the cell. */
  readonly className?: string | undefined;
};
