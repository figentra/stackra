/**
 * Stackra file contract:
 * Purpose: the web `Meter` on HeroUI v3's Meter (React Aria, `role="meter"`): a label, the value in the customer's
 *          digits, and a bar coloured by `meterToneOf` (green in the optimum's part, amber one part away, red beyond).
 * Boundary: the colour is never the only signal: the value is written beside the label and read with the meter. The
 *           bar fills from the reading start.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.4.1 and 4.1.2; STA-1371.
 */
import { Label, Meter as HeroMeter, cn } from "@heroui/react";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { meterToneOf } from "#core/functions/meter-tone-of.function";
import { useNumberFormat } from "#react/hooks/use-number-format";
import type { MeterProps } from "#react/meter/meter.props";

/** One measure on a scale. */
export function Meter({
  value,
  minValue = 0,
  maxValue = 100,
  low,
  high,
  optimum,
  label,
  formatOptions,
  valueLabel,
  className,
}: MeterProps): ReactElement {
  const format = useNumberFormat();
  const tone = meterToneOf(value, { minValue, maxValue, low, high, optimum });
  const text =
    valueLabel ??
    (formatOptions
      ? format(value, formatOptions)
      : format((value - minValue) / (maxValue - minValue || 1), { style: "percent" }));
  return (
    <HeroMeter
      value={value}
      color={tone}
      valueLabel={text}
      {...omitUndefined({ minValue, maxValue })}
      data-tone={tone}
      className={cn("grid w-full gap-1.5", className) ?? ""}
    >
      <div className="flex items-baseline justify-between gap-3">
        <Label>{label}</Label>
        <HeroMeter.Output className="text-sm text-muted tabular-nums" />
      </div>
      <HeroMeter.Track>
        <HeroMeter.Fill />
      </HeroMeter.Track>
    </HeroMeter>
  );
}
