/**
 * Stackra file contract:
 * Purpose: the native `SettingsSwitchCell`: a SettingsCell with the house Switch at the inline end, named by the title.
 * Boundary: the Switch's own semantics and haptic; drawing is the SettingsCell's.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2.
 */
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { SettingsCell } from "#native/settings-cell/settings-cell";
import type { SettingsSwitchCellProps } from "#native/settings-cell/settings-switch-cell.props";
import { Switch } from "#native/switch/switch";

/** A setting turned on and off. */
export function SettingsSwitchCell({
  value,
  defaultValue,
  onChange,
  isDisabled,
  ...cell
}: SettingsSwitchCellProps): ReactElement {
  return (
    <SettingsCell
      {...cell}
      {...omitUndefined({ isDisabled })}
      control={
        <Switch
          accessibilityLabel={cell.title}
          {...(cell.description ? { accessibilityHint: cell.description } : {})}
          {...omitUndefined({ value, defaultValue, onChange, isDisabled })}
        />
      }
    />
  );
}
