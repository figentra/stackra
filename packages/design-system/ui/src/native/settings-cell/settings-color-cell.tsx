/**
 * Stackra file contract:
 * Purpose: the native `SettingsColorCell`: a SettingsCell with a wrapping row of colour swatches under the title and
 *          the picked colour's dot at the inline end.
 * Boundary: the swatches are SwatchGroup's, named by the title.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3).
 */
import { useState, type ReactElement } from "react";
import { View } from "react-native";

import { COLOR_SWATCHES } from "#core/constants/color-swatches.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { SettingsCell } from "#native/settings-cell/settings-cell";
import type { SettingsColorCellProps } from "#native/settings-cell/settings-color-cell.props";
import { SwatchGroup } from "#native/settings-cell/swatch-group";

/** A setting that is a colour. */
export function SettingsColorCell({
  value,
  defaultValue,
  onChange,
  swatches = COLOR_SWATCHES,
  isDisabled,
  ...cell
}: SettingsColorCellProps): ReactElement {
  const [own, setOwn] = useState(defaultValue ?? null);
  const current = value ?? own;
  return (
    <SettingsCell
      {...cell}
      {...omitUndefined({ isDisabled })}
      control={
        current ? (
          <View
            className="size-5 rounded-[var(--radius-pill)] border border-border"
            style={{ backgroundColor: current }}
          />
        ) : null
      }
    >
      <SwatchGroup
        label={cell.title}
        swatches={swatches}
        value={current}
        isDisabled={isDisabled}
        onChange={(hex) => {
          if (value === undefined) setOwn(hex);
          onChange?.(hex);
        }}
      />
    </SettingsCell>
  );
}
