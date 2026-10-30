/**
 * Stackra file contract:
 * Purpose: the props every runtime's `SettingsSwitchCell` takes: a SettingsCell whose control is a Switch.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3).
 */
import type { SettingsCellContractProps } from "#contracts/types/settings-cell-contract-props.type";

/** Props shared by the web and native `SettingsSwitchCell`. */
export interface SettingsSwitchCellContractProps extends Omit<
  SettingsCellContractProps,
  "control"
> {
  /** The value, for a controlled cell. */
  readonly value?: boolean | undefined;
  /** The starting value, for an uncontrolled cell. */
  readonly defaultValue?: boolean | undefined;
  /** Called with each new value. */
  readonly onChange?: ((value: boolean) => void) | undefined;
}
