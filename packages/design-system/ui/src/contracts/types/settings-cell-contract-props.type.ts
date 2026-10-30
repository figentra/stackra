/**
 * Stackra file contract:
 * Purpose: the props every runtime's `SettingsCell` takes: one setting as a row (icon, title, line under it) with its
 *          control at the inline end. The family (`SettingsSwitchCell`, `SettingsSelectCell`, `SettingsSliderCell`,
 *          `SettingsColorCell`) fills the control.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3).
 */
import type { IconName } from "@stackra/icons/contracts";
import type { ReactNode } from "react";

/** Props shared by the web and native `SettingsCell` and its family. */
export interface SettingsCellContractProps {
  /** The setting's title; it names the control. */
  readonly title: string;
  /** A line under the title; it describes the control. */
  readonly description?: string | undefined;
  /** A leading icon from the house set. */
  readonly icon?: IconName | undefined;
  /** The control at the inline end; the family members fill it. */
  readonly control?: ReactNode;
  /** What sits under the row, full width: the slider of a SettingsSliderCell, the swatches of a SettingsColorCell. */
  readonly children?: ReactNode;
  /** True to refuse change and show the disabled style. */
  readonly isDisabled?: boolean | undefined;
}
