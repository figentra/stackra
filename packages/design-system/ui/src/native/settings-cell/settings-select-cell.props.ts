/**
 * Stackra file contract:
 * Purpose: `SettingsSelectCellProps`, the props of the native `SettingsSelectCell`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305 (rules 10 to 13).
 */
import type { SettingsSelectCellContractProps } from "#contracts/types/settings-select-cell-contract-props.type";

/** Props of the native SettingsSelectCell. */
export type SettingsSelectCellProps = SettingsSelectCellContractProps & {
  /** Styles the cell. */
  readonly className?: string | undefined;
};
