/**
 * Stackra file contract:
 * Purpose: the props every runtime's `SettingsSliderCell` takes: a SettingsCell whose control is a Slider under the title, its value written at the inline end.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3).
 */
import type { SettingsCellContractProps } from "#contracts/types/settings-cell-contract-props.type";

/** Props shared by the web and native `SettingsSliderCell`. */
export interface SettingsSliderCellContractProps extends Omit<
  SettingsCellContractProps,
  "control"
> {
  /** The value, for a controlled cell. */
  readonly value?: number | undefined;
  /** The starting value, for an uncontrolled cell. */
  readonly defaultValue?: number | undefined;
  /** Called with each new value. */
  readonly onChange?: ((value: number) => void) | undefined;
  /** The lowest value; defaults to 0. */
  readonly minValue?: number | undefined;
  /** The highest value; defaults to 100. */
  readonly maxValue?: number | undefined;
  /** The step; defaults to 1. */
  readonly step?: number | undefined;
  /** How the value is written, for example a percent. */
  readonly formatOptions?: Intl.NumberFormatOptions | undefined;
}
