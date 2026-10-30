/**
 * Stackra file contract:
 * Purpose: the web `StackedMeter`: a title with "used of whole", one rounded bar split into coloured parts from the
 *          reading start over a muted track, and a legend of each part's name and amount.
 * Boundary: the bar is decoration; the legend is the text people and screen readers read. Colours are theme variables.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.1 and 1.4.11; STA-1371.
 */
import { cn } from "@heroui/react";
import { type ReactElement, useId } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { chartColorOf } from "#core/functions/chart-color-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { meterSharesOf } from "#core/functions/meter-shares-of.function";
import { paintOf } from "#react/chart/paint-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import { useUiText } from "#react/hooks/use-ui-text";
import type { StackedMeterProps } from "#react/stacked-meter/stacked-meter.props";

/** One bar of parts of a whole. */
export function StackedMeter({
  segments,
  label,
  max,
  valueFormat,
  palette,
  showLegend = true,
  className,
}: StackedMeterProps): ReactElement {
  const { locale } = useChartLocale();
  const t = useUiText();
  const id = useId();
  const { shares, total } = meterSharesOf(segments, max);
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const color = (index: number) => paintOf(chartColorOf(segments[index], index, palette));
  return (
    <div
      role="group"
      aria-labelledby={id}
      data-slot="stacked-meter"
      className={cn("flex w-full flex-col gap-2", className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span id={id} className="text-sm font-medium">
          {label}
        </span>
        <span className="text-xs text-muted tabular-nums">
          {t(UI_KEYS.ui.stacked_meter.total, {
            used: value(total),
            max: value(Math.max(total, max ?? 0)),
          })}
        </span>
      </div>
      <div
        aria-hidden
        className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-[var(--radius-pill)] bg-default/50"
      >
        {segments.map((segment, index) =>
          (shares[index] ?? 0) > 0 ? (
            <span
              key={segment.key}
              className="h-full first:rounded-s-[var(--radius-pill)]"
              style={{ width: `${(shares[index] ?? 0) * 100}%`, backgroundColor: color(index) }}
            />
          ) : null,
        )}
      </div>
      {showLegend ? (
        <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0">
          {segments.map((segment, index) => (
            <li key={segment.key} className="flex items-center gap-1.5 text-xs">
              <span
                aria-hidden
                className="size-2 rounded-[var(--radius-pill)]"
                style={{ backgroundColor: color(index) }}
              />
              <span className="text-muted">{segment.label}</span>
              <span className="font-medium tabular-nums">{value(segment.value)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
