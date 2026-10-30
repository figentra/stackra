/**
 * Stackra file contract:
 * Purpose: the web `SettingsSwitchCell`: a SettingsCell with the house Switch at the inline end, named by the title
 *          and described by the line under it.
 * Boundary: the Switch's own keyboard and semantics; drawing is the SettingsCell's.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2.
 */
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { SettingsCell } from "#react/settings-cell/settings-cell";
import type { SettingsSwitchCellProps } from "#react/settings-cell/settings-switch-cell.props";
import { Switch } from "#react/switch/switch";

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
      // oxlint-disable-next-line react/no-unstable-nested-components -- a render callback SettingsCell calls with the ids, not a component type
      control={(ids) => (
        <Switch
          aria-labelledby={ids.title}
          {...(ids.description ? { "aria-describedby": ids.description } : {})}
          {...omitUndefined({ value, defaultValue, onChange, isDisabled })}
        />
      )}
    />
  );
}
