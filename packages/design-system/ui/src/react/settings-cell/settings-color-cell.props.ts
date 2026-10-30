/**
 * Stackra file contract:
 * Purpose: `SettingsColorCellProps`, the props of the web `SettingsColorCell`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305 (rules 10 to 13).
 */
import type { SettingsColorCellContractProps } from "#contracts/types/settings-color-cell-contract-props.type";

/** Props of the web SettingsColorCell. */
export type SettingsColorCellProps = SettingsColorCellContractProps & {
  /** Styles the cell. */
  readonly className?: string | undefined;
};
