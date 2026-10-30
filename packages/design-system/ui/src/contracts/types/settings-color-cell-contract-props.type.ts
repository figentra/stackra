/**
 * Stackra file contract:
 * Purpose: the props every runtime's `SettingsColorCell` takes: a SettingsCell whose control is a row of colour swatches under the title.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3).
 */
import type { SettingsCellContractProps } from "#contracts/types/settings-cell-contract-props.type";

/** Props shared by the web and native `SettingsColorCell`. */
export interface SettingsColorCellContractProps extends Omit<SettingsCellContractProps, "control"> {
  /** The value, for a controlled cell. */
  readonly value?: string | undefined;
  /** The starting value, for an uncontrolled cell. */
  readonly defaultValue?: string | undefined;
  /** Called with each new value. */
  readonly onChange?: ((value: string) => void) | undefined;
  /** The colours offered, as `#rrggbb`; defaults to the house set. */
  readonly swatches?: readonly string[] | undefined;
}
