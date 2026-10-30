/**
 * Stackra file contract:
 * Purpose: `SettingsSliderCellProps`, the props of the native `SettingsSliderCell`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305 (rules 10 to 13).
 */
import type { SettingsSliderCellContractProps } from "#contracts/types/settings-slider-cell-contract-props.type";

/** Props of the native SettingsSliderCell. */
export type SettingsSliderCellProps = SettingsSliderCellContractProps & {
  /** Styles the cell. */
  readonly className?: string | undefined;
};
