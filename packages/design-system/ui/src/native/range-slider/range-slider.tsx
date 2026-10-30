/**
 * Stackra file contract:
 * Purpose: the native `RangeSlider` on HeroUI Native's Slider with two thumbs: a low and a high value on one track,
 *          the range written above it in the locale's numbers and `formatOptions`.
 * Boundary: HeroUI Native's slider: each thumb is adjustable for VoiceOver and TalkBack; the thumbs never cross.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2.
 */
import { Slider } from "heroui-native";
import { useState, type ReactElement } from "react";
import { View } from "react-native";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Text } from "#native/text/text";
import type { RangeSliderProps } from "#native/range-slider/range-slider.props";

/** Two thumbs on one track. */
export function RangeSlider({
  label,
  description,
  minValue = 0,
  maxValue = 100,
  step = 1,
  formatOptions,
  value,
  defaultValue,
  onChange,
  isDisabled,
  className,
}: RangeSliderProps): ReactElement {
  const [own, setOwn] = useState<readonly [number, number]>(defaultValue ?? [minValue, maxValue]);
  const range = value ?? own;
  return (
    <Slider
      value={[...range]}
      onChange={(next) => {
        if (!Array.isArray(next)) return;
        const pair = [next[0] ?? minValue, next[1] ?? maxValue] as const;
        if (value === undefined) setOwn(pair);
        onChange?.(pair);
      }}
      {...omitUndefined({ minValue, maxValue, step, formatOptions, isDisabled })}
      {...(typeof label === "string" ? { accessibilityLabel: label } : {})}
      className={`gap-2 ${className ?? ""}`}
    >
      <View className="flex-row items-baseline justify-between gap-2">
        {label == null ? <View /> : <Text className="font-medium">{label}</Text>}
        <Slider.Output />
      </View>
      <Slider.Track>
        <Slider.Fill />
        <Slider.Thumb index={0} />
        <Slider.Thumb index={1} />
      </Slider.Track>
      {description == null ? null : (
        <Text type="small" tone="muted">
          {description}
        </Text>
      )}
    </Slider>
  );
}
