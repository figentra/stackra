/**
 * Stackra file contract:
 * Purpose: `SettingsCellProps`, the props of the web `SettingsCell`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305 (rules 10 to 13).
 */
import type { SettingsCellContractProps } from "#contracts/types/settings-cell-contract-props.type";

/** Props of the web SettingsCell. */
export type SettingsCellProps = SettingsCellContractProps & {
  /** Styles the cell. */
  readonly className?: string | undefined;
};
