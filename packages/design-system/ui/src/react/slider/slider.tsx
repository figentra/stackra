/**
 * Stackra file contract:
 * Purpose: the web `Slider` on HeroUI v3's Slider with one thumb: a value on a track, written above it in the
 *          customer's digits and `formatOptions`, with optional marks under the track, a vertical layout and a paired
 *          number input for an exact value.
 * Boundary: React Aria's slider: the thumb is an input stepped by the arrow keys (mirrored in right-to-left), Page
 *           Up/Down and Home/End. The fill is RangeSlider's logical one. Marks are drawn only; the thumb reads the value.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 2.1.1, 2.5.7 and 4.1.2; STA-1371.
 */
import { Description, Label, Slider as HeroSlider, cn } from "@heroui/react";
import { useState, type ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useNumberFormat } from "#react/hooks/use-number-format";
import { NumberField } from "#react/number-field/number-field";
import { SliderFill } from "#react/range-slider/slider-fill";
import type { SliderProps } from "#react/slider/slider.props";

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
  name: _name,
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
  const share = (at: number) => ((at - minValue) / (maxValue - minValue || 1)) * 100;
  const name = typeof label === "string" ? label : undefined;
  const markList = marks?.length ? (
    <div
      aria-hidden
      data-slot="slider-marks"
      className={cn(
        "relative text-xs text-muted tabular-nums",
        isVertical ? "my-3 w-12" : "mx-3 h-8",
      )}
    >
      {marks.map((mark) => (
        <span
          key={mark.value}
          className={cn(
            "absolute flex items-center gap-1 whitespace-nowrap",
            isVertical
              ? "start-0 translate-y-1/2"
              : "top-0 flex-col ltr:-translate-x-1/2 rtl:translate-x-1/2",
          )}
          style={
            isVertical
              ? { bottom: `${share(mark.value)}%` }
              : { insetInlineStart: `${share(mark.value)}%` }
          }
        >
          <span className={cn("bg-muted/40", isVertical ? "h-px w-2" : "h-2 w-px")} />
          {mark.label ?? format(mark.value, formatOptions)}
        </span>
      ))}
    </div>
  ) : null;
  const slider = (
    <HeroSlider
      value={current}
      onChange={(next) => change(Array.isArray(next) ? (next[0] ?? minValue) : next)}
      orientation={orientation}
      {...omitUndefined({ minValue, maxValue, step, formatOptions, isDisabled })}
      className={
        cn(
          // A flex column, not HeroUI's two-column grid: the marks need the track's full width under it.
          "flex flex-col gap-2",
          isVertical ? "h-64 w-fit" : "w-full",
          !hasInput && className,
        ) ?? ""
      }
    >
      <div className="flex items-baseline justify-between gap-2">
        {label ? <Label>{label}</Label> : <span />}
        {hasInput && !isVertical ? null : (
          <HeroSlider.Output className="text-sm text-muted tabular-nums" />
        )}
      </div>
      <div className={cn("flex min-h-0", isVertical ? "flex-1 gap-2" : "flex-col")}>
        <HeroSlider.Track>
          {({ state }) => (
            <>
              <SliderFill state={state} />
              <HeroSlider.Thumb />
            </>
          )}
        </HeroSlider.Track>
        {markList}
      </div>
      {description ? <Description>{description}</Description> : null}
    </HeroSlider>
  );
  if (!hasInput || isVertical) return slider;
  return (
    <div data-slot="slider-with-input" className={cn("flex w-full items-start gap-3", className)}>
      <div className="min-w-0 flex-1">{slider}</div>
      <NumberField
        {...omitUndefined({ "aria-label": name })}
        value={current}
        onChange={(next) => {
          if (next !== null) change(Math.min(maxValue, Math.max(minValue, next)));
        }}
        isFullWidth={false}
        hasSteppers={false}
        className="w-28 shrink-0 pt-6"
        {...omitUndefined({ minValue, maxValue, step, formatOptions, isDisabled })}
      />
    </div>
  );
}
