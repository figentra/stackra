/**
 * Stackra file contract:
 * Purpose: the web `BulletChart`: one row per measure, its label at the reading start, then a scale with the
 *          qualitative bands (three opaque neutral steps, darkest first), the value bar in the accent, lit from the top, across
 *          the middle, the target as an upright tick, and the value written at the reading end; the data table carries
 *          the numbers.
 * Boundary: HTML laid out with logical insets, so the scale grows from the reading start (the right in Arabic). The
 *           widths are inline percentages; the bar eases in unless the motion setting is reduced.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and
 *          2.3.3; STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { bulletScaleOf } from "#core/functions/bullet-scale-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import type { BulletChartProps } from "#react/bullet-chart/bullet-chart.props";
import { ChartFrame } from "#react/chart/chart-frame";
import { paintOf } from "#react/chart/paint-of.function";
import { topLitOf } from "#react/chart/top-lit-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import { useUiText } from "#react/hooks/use-ui-text";

/**
 * The bands' shares of the text colour over the card, nearest the start (poor) first: three opaque neutral steps far
 * enough apart to tell poor, fair and good apart in either scheme, and all well under the value bar.
 */
const BAND_SHARE = [30, 17, 7] as const;

/** Measures against their targets. */
export function BulletChart({
  items,
  label,
  valueFormat,
  color = "chart-ramp-1",
  className,
}: BulletChartProps): ReactElement {
  const { locale, words } = useChartLocale();
  const t = useUiText();
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const table = {
    head: [words.category, words.value, t(UI_KEYS.ui.chart.target)],
    rows: items.map((item) => [
      item.label,
      value(item.value),
      item.target === undefined ? "" : value(item.target),
    ]),
  };
  return (
    <ChartFrame label={label} table={table} legend={[]} className={className}>
      <div role="img" aria-label={label} className="flex flex-col gap-3">
        {items.map((item) => {
          const scale = bulletScaleOf(item);
          return (
            <div
              key={item.key}
              aria-hidden
              className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3"
            >
              <span className="truncate text-xs text-muted">{item.label}</span>
              <span className="relative h-6 overflow-hidden rounded-[var(--radius-sm,4px)]">
                {scale.bands.map((band, index) => (
                  <span
                    key={band.from}
                    className="absolute inset-y-0"
                    style={{
                      insetInlineStart: `${band.from}%`,
                      width: `${band.to - band.from}%`,
                      backgroundColor: `color-mix(in oklab, ${paintOf("foreground")} ${
                        BAND_SHARE[Math.min(index, BAND_SHARE.length - 1)]
                      }%, ${paintOf("surface")})`,
                    }}
                  />
                ))}
                <span
                  className={cn(
                    "absolute inset-y-[30%] start-0 rounded-e-[var(--radius-sm,4px)] transition-[width] duration-(--duration-slower) motion-reduce:transition-none",
                  )}
                  style={{
                    width: `${scale.value}%`,
                    backgroundColor: paintOf(color),
                    backgroundImage: `linear-gradient(${topLitOf(paintOf(color))}, ${paintOf(color)})`,
                  }}
                />
                {scale.target === null ? null : (
                  <span
                    className="absolute inset-y-[8%] w-0.75 -translate-x-1/2 rounded-[var(--radius-pill)] rtl:translate-x-1/2"
                    style={{
                      insetInlineStart: `${scale.target}%`,
                      backgroundColor: paintOf("foreground"),
                    }}
                  />
                )}
              </span>
              <span className="text-end text-sm font-semibold tabular-nums">
                {value(item.value)}
              </span>
            </div>
          );
        })}
      </div>
    </ChartFrame>
  );
}
