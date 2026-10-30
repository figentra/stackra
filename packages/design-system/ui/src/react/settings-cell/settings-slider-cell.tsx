/**
 * Stackra file contract:
 * Purpose: the web `SettingsSliderCell`: a SettingsCell with HeroUI v3's Slider under the title and its value written
 *          at the inline end, in the locale's digits.
 * Boundary: the slider is named by the title (`aria-labelledby`); arrow keys step it, mirrored in right-to-left.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 2.1.1,
 *          4.1.2.
 */
import { Slider } from "@heroui/react";
import { useState, type ReactElement } from "react";
import { useLocale } from "react-aria-components";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { SettingsCell } from "#react/settings-cell/settings-cell";
import type { SettingsSliderCellProps } from "#react/settings-cell/settings-slider-cell.props";

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
  const { locale } = useLocale();
  const [own, setOwn] = useState(defaultValue ?? minValue);
  const current = value ?? own;
  return (
    <SettingsCell
      {...cell}
      {...omitUndefined({ isDisabled })}
      control={
        <span aria-hidden className="text-sm text-muted tabular-nums">
          {new Intl.NumberFormat(locale, formatOptions).format(current)}
        </span>
      }
    >
      <Slider
        aria-label={cell.title}
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
