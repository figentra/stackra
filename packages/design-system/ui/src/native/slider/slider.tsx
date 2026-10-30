/**
 * Stackra file contract:
 * Purpose: the native `Slider` on HeroUI Native's Slider with one thumb: a value on a track, written above it in the
 *          customer's digits and `formatOptions`, with optional marks under the track, a vertical layout and a paired
 *          number input for an exact value.
 * Boundary: HeroUI Native's slider: the thumb is adjustable for VoiceOver and TalkBack. Marks are placed from the
 *           reading start (`start`), so they mirror in right-to-left, and are hidden from screen readers.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 4.1.2; STA-1371.
 */
import { Slider as HeroSlider } from "heroui-native";
import { useState, type ReactElement } from "react";
import { View } from "react-native";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useNumberFormat } from "#native/hooks/use-number-format";
import { NumberField } from "#native/number-field/number-field";
import type { SliderProps } from "#native/slider/slider.props";
import { Text } from "#native/text/text";

/** One thumb on one track. */
export function Slider({
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
  marks,
  orientation = "horizontal",
  hasInput = false,
  className,
}: SliderProps): ReactElement {
  const format = useNumberFormat();
  const [own, setOwn] = useState(defaultValue ?? minValue);
  const current = value ?? own;
  const isVertical = orientation === "vertical";
  const change = (next: number) => {
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  const share = (at: number) => `${((at - minValue) / (maxValue - minValue || 1)) * 100}%` as const;
  const name = typeof label === "string" ? label : undefined;
  const withInput = hasInput && !isVertical;
  const marksView = marks?.length ? (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      className={isVertical ? "relative my-3 w-14" : "relative mx-3 h-8"}
    >
      {marks.map((mark) => (
        <View
          key={mark.value}
          className={
            isVertical ? "absolute flex-row items-center gap-1" : "absolute w-16 items-center"
          }
          style={
            isVertical
              ? { bottom: share(mark.value), transform: [{ translateY: 8 }] }
              : { start: share(mark.value), marginStart: -32 }
          }
        >
          <View className={isVertical ? "h-px w-2 bg-muted/40" : "h-2 w-px bg-muted/40"} />
          <Text type="caption" tone="muted">
            {mark.label ?? format(mark.value, formatOptions)}
          </Text>
        </View>
      ))}
    </View>
  ) : null;
  return (
    <View className={`flex-row items-start gap-3 ${className ?? ""}`}>
      <HeroSlider
        value={current}
        onChange={(next) => change(Array.isArray(next) ? (next[0] ?? minValue) : next)}
        orientation={orientation}
        {...omitUndefined({ minValue, maxValue, step, formatOptions, isDisabled })}
        {...(name ? { accessibilityLabel: name } : {})}
        className={isVertical ? "h-64 gap-2" : "flex-1 gap-2"}
      >
        <View className="flex-row items-baseline justify-between gap-2">
          {label == null ? <View /> : <Text className="font-medium">{label}</Text>}
          {withInput ? null : <HeroSlider.Output />}
        </View>
        <View className={isVertical ? "flex-1 flex-row gap-2" : ""}>
          <HeroSlider.Track>
            <HeroSlider.Fill />
            <HeroSlider.Thumb />
          </HeroSlider.Track>
          {marksView}
        </View>
        {description == null ? null : (
          <Text type="small" tone="muted">
            {description}
          </Text>
        )}
      </HeroSlider>
      {withInput ? (
        <NumberField
          {...(name ? { accessibilityLabel: name } : {})}
          value={current}
          onChange={(next) => {
            if (next !== null) change(Math.min(maxValue, Math.max(minValue, next)));
          }}
          isFullWidth={false}
          hasSteppers={false}
          className="w-28 pt-6"
          {...omitUndefined({ minValue, maxValue, step, formatOptions, isDisabled })}
        />
      ) : null}
    </View>
  );
}
