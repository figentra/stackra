/**
 * Stackra file contract:
 * Purpose: the web `ProgressCircle` on HeroUI v3's ProgressCircle (React Aria): maps the shared contract onto it
 *          (`tone` to its colour, no `value` to `isIndeterminate`, `label` to `aria-label`) and passes every other
 *          HeroUI prop through unchanged.
 * Boundary: no styling of its own; the SVG, the sweep and its reduced-motion rule are HeroUI's, themed by
 *          `@stackra/tokens`. It draws no text, so its name and value are spoken only. Separate from Spinner.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; ADR 0165 (HeroUI v3 on web); owner
 *          decision 6 of STA-350 (thin wrappers); WCAG 2.2 SC 4.1.2.
 */
import { ProgressCircle as HeroProgressCircle } from "@heroui/react";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { ProgressCircleProps } from "#react/progress-circle/progress-circle.props";

/**
 * A ring that fills as work completes: pass `value` for a determinate one, leave it out for an indeterminate
 * sweep. It is always a named `progressbar`, and unlike a Spinner it can say how far along the work is.
 */
export function ProgressCircle({
  value,
  minValue,
  maxValue,
  size,
  tone = "accent",
  label,
  valueLabel,
  ...rest
}: ProgressCircleProps): ReactElement {
  return (
    <HeroProgressCircle
      {...rest}
      {...omitUndefined({ value, minValue, maxValue, size, valueLabel })}
      color={tone}
      isIndeterminate={value === undefined}
      aria-label={label}
    >
      <HeroProgressCircle.Track>
        <HeroProgressCircle.TrackCircle />
        <HeroProgressCircle.FillCircle />
      </HeroProgressCircle.Track>
    </HeroProgressCircle>
  );
}
