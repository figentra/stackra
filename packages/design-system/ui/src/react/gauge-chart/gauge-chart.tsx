/**
 * Stackra file contract:
 * Purpose: the web `GaugeChart`: a value on a three-quarter ring in the look of the progress circle (a muted track and
 *          a rounded value arc), a target mark across the ring, and the figure with its word in the middle. It is a
 *          `meter`, so a screen reader hears its name, value, range and target.
 * Boundary: SVG with presentation attributes in theme colours; the centre is HTML so Arabic shapes as text does
 *           everywhere. A gauge is symmetric, so it is not mirrored in Arabic.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); chart style spec (2026-10-28) section 5; WCAG 2.2 SC 1.1.1, 1.4.11 and
 *          4.1.2; STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { GAUGE_SWEEP } from "#core/constants/gauge-sweep.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { arcPathOf } from "#core/functions/arc-path-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { gaugeAngleOf } from "#core/functions/gauge-angle-of.function";
import { CHART_PAINT } from "#react/chart/chart-paint.constant";
import { paintOf } from "#react/chart/paint-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import type { GaugeChartProps } from "#react/gauge-chart/gauge-chart.props";
import { useUiText } from "#react/hooks/use-ui-text";

/** The drawing box and the ring's radius and thickness, in its units. */
const BOX = 200;
const RADIUS = 84;
const STROKE = 14;

/** Degrees to radians, the unit the shared arc helper takes. */
const radians = (degrees: number) => (degrees * Math.PI) / 180;

/** A value against a target on a ring. */
export function GaugeChart({
  value,
  min = 0,
  max = 100,
  target,
  label,
  centerLabel,
  valueFormat,
  color = "chart-ramp-1",
  size = 200,
  className,
}: GaugeChartProps): ReactElement {
  const { locale } = useChartLocale();
  const t = useUiText();
  const written = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const c = BOX / 2;
  const end = gaugeAngleOf(value, min, max);
  const mark =
    target === undefined ? undefined : (gaugeAngleOf(target, min, max) - 90) * (Math.PI / 180);
  const text =
    target === undefined
      ? written(value)
      : t(UI_KEYS.ui.chart.of_target, { value: written(value), target: written(target) });
  return (
    <figure data-slot="gauge-chart" className={cn("m-0 flex flex-col items-center", className)}>
      <div
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={text}
        className="relative"
        style={{ width: size, height: size }}
      >
        <svg viewBox={`0 0 ${BOX} ${BOX}`} className="size-full" aria-hidden="true">
          <path
            d={arcPathOf(
              c,
              c,
              RADIUS,
              RADIUS,
              radians(GAUGE_SWEEP.start),
              radians(GAUGE_SWEEP.start + GAUGE_SWEEP.sweep),
            )}
            fill="none"
            stroke={CHART_PAINT.track.fill}
            strokeOpacity={CHART_PAINT.track.fillOpacity}
            strokeWidth={STROKE}
            strokeLinecap="round"
          />
          {end > GAUGE_SWEEP.start ? (
            <path
              d={arcPathOf(c, c, RADIUS, RADIUS, radians(GAUGE_SWEEP.start), radians(end))}
              fill="none"
              stroke={paintOf(color)}
              strokeWidth={STROKE}
              strokeLinecap="round"
            />
          ) : null}
          {mark === undefined ? null : (
            <line
              x1={c + (RADIUS - STROKE / 2 - 1) * Math.cos(mark)}
              y1={c + (RADIUS - STROKE / 2 - 1) * Math.sin(mark)}
              x2={c + (RADIUS + STROKE / 2 + 5) * Math.cos(mark)}
              y2={c + (RADIUS + STROKE / 2 + 5) * Math.sin(mark)}
              stroke={paintOf("foreground")}
              strokeWidth={3}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div
          aria-hidden="true"
          // A disc of the surface under the words: text over the SVG leaves axe no ground to measure it against.
          className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-surface text-center"
        >
          <span className="text-xl leading-tight font-bold tabular-nums">{written(value)}</span>
          {centerLabel ? <span className="text-xs text-muted">{centerLabel}</span> : null}
          {target === undefined ? null : (
            <span className="mt-1 text-xs text-muted tabular-nums">
              {t(UI_KEYS.ui.chart.target)}: {written(target)}
            </span>
          )}
        </div>
      </div>
      <figcaption className="sr-only">{label}</figcaption>
    </figure>
  );
}
