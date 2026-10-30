/**
 * Stackra file contract:
 * Purpose: the web `RangeSlider` on HeroUI v3's Slider with two thumbs: a low and a high value on one track, the
 *          range written above it in the locale's digits and `formatOptions`.
 * Boundary: React Aria's slider: each thumb is its own input, named "<label> minimum" and "maximum" by React Aria,
 *           stepped by the arrow keys (mirrored in right-to-left); the thumbs never cross.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 2.1.1,
 *          4.1.2.
 */
import { Description, Label, Slider, cn } from "@heroui/react";
import { useState, type ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { RangeSliderProps } from "#react/range-slider/range-slider.props";
import { SliderFill } from "#react/range-slider/slider-fill";

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
  name: _name,
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
      {...(typeof label === "string" ? {} : { "aria-label": "range" })}
      className={cn("grid w-full gap-2", className) ?? ""}
    >
      <div className="flex items-baseline justify-between gap-2">
        {label ? <Label>{label}</Label> : <span />}
        <Slider.Output className="text-sm text-muted tabular-nums" />
      </div>
      <Slider.Track>
        {({ state }) => (
          <>
            <SliderFill state={state} />
            <Slider.Thumb index={0} />
            <Slider.Thumb index={1} />
          </>
        )}
      </Slider.Track>
      {description ? <Description>{description}</Description> : null}
    </Slider>
  );
}
