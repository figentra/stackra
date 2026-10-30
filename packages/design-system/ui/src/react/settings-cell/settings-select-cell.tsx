/**
 * Stackra file contract:
 * Purpose: the web `SettingsSelectCell`: a SettingsCell whose value sits at the inline end as an InlineSelect.
 * Boundary: the InlineSelect is named by the title; drawing is the SettingsCell's.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2.
 */
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { InlineSelect } from "#react/inline-select/inline-select";
import { SettingsCell } from "#react/settings-cell/settings-cell";
import type { SettingsSelectCellProps } from "#react/settings-cell/settings-select-cell.props";

/** A setting with one choice from a list. */
export function SettingsSelectCell({
  items,
  value,
  defaultValue,
  onChange,
  isDisabled,
  ...cell
}: SettingsSelectCellProps): ReactElement {
  return (
    <SettingsCell
      {...cell}
      {...omitUndefined({ isDisabled })}
      control={
        <InlineSelect
          label={cell.title}
          items={items}
          {...omitUndefined({ value, defaultValue, onChange, isDisabled })}
        />
      }
    />
  );
}
