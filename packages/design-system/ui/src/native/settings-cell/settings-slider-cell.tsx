/**
 * Stackra file contract:
 * Purpose: the native `SettingsSliderCell`: a SettingsCell with HeroUI Native's Slider under the title and its value
 *          written at the inline end in the locale's digits.
 * Boundary: HeroUI Native's slider (an adjustable control named by the title).
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2.
 */
import { Slider } from "heroui-native";
import { useState, type ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { SettingsCell } from "#native/settings-cell/settings-cell";
import type { SettingsSliderCellProps } from "#native/settings-cell/settings-slider-cell.props";
import { Text } from "#native/text/text";

/** A setting on a scale. */
export function SettingsSliderCell({
  value,
  defaultValue,
  onChange,
  minValue = 0,
  maxValue = 100,
  step = 1,
  formatOptions,
  isDisabled,
  ...cell
}: SettingsSliderCellProps): ReactElement {
  const { locale } = useDesignSystem();
  const [own, setOwn] = useState(defaultValue ?? minValue);
  const current = value ?? own;
  return (
    <SettingsCell
      {...cell}
      {...omitUndefined({ isDisabled })}
      control={
        <Text type="small" tone="muted" importantForAccessibility="no">
          {new Intl.NumberFormat(locale, formatOptions).format(current)}
        </Text>
      }
    >
      <Slider
        accessibilityLabel={cell.title}
        value={current}
        onChange={(next) => {
          const number = Array.isArray(next) ? (next[0] ?? minValue) : next;
          if (value === undefined) setOwn(number);
          onChange?.(number);
        }}
        {...omitUndefined({ minValue, maxValue, step, formatOptions, isDisabled })}
      >
        <Slider.Track>
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>
    </SettingsCell>
  );
}
