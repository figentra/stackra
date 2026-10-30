/**
 * Stackra file contract:
 * Purpose: the web `ChartLegend`: a centred, wrapping row of swatches and series labels under a chart. With
 *          `onToggle` every entry is a toggle button that hides or shows its series (Space or Enter, `aria-pressed`),
 *          and a hidden series reads as a hollow swatch and a struck label, so the state never rests on colour alone.
 *          Every chart draws one for two series or more; it is exported for a legend set apart from its chart.
 * Boundary: HTML laid out with flex, so it follows the reading direction; the swatch is an SVG filled with the series'
 *           theme colour, so no style attribute is written.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); WCAG 2.2 SC 1.1.1, 1.4.1, 1.4.11, 2.1.1 and 4.1.2; STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { chartColorOf } from "#core/functions/chart-color-of.function";
import { paintOf } from "#react/chart/paint-of.function";
import type { ChartLegendProps } from "#react/chart-legend/chart-legend.props";
import { useUiText } from "#react/hooks/use-ui-text";

/** The default for an unset list prop: one stable empty array, not a new one each render. */
const NONE: readonly never[] = [];

/** A row of series swatches and labels, toggles when the chart can hide series. */
export function ChartLegend({
  series,
  palette,
  onToggle,
  hiddenKeys = NONE,
  showComparison = false,
  className,
}: ChartLegendProps): ReactElement {
  const t = useUiText();
  return (
    <ul
      data-slot="chart-legend"
      aria-label={onToggle ? t(UI_KEYS.ui.chart.series) : undefined}
      className={cn(
        "m-0 flex list-none flex-wrap items-center justify-center gap-x-4 gap-y-1 p-0 text-xs text-muted",
        className,
      )}
    >
      {series.map((item, index) => {
        const color = paintOf(chartColorOf(item, index, palette));
        const isHidden = hiddenKeys.includes(item.key);
        const swatch = (
          <svg viewBox="0 0 8 8" className="size-2 shrink-0" aria-hidden="true">
            <circle
              cx="4"
              cy="4"
              r={isHidden ? 3.25 : 4}
              fill={isHidden ? "none" : color}
              stroke={color}
              strokeWidth={isHidden ? 1.5 : 0}
            />
          </svg>
        );
        return (
          <li key={item.key} className="flex items-center">
            {onToggle ? (
              <button
                type="button"
                aria-pressed={!isHidden}
                onClick={() => onToggle(item.key)}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-control-inner)] px-1 py-0.5 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus",
                  isHidden && "line-through",
                )}
              >
                {swatch}
                {item.label}
              </button>
            ) : (
              <span className="flex items-center gap-1.5">
                {swatch}
                {item.label}
              </span>
            )}
          </li>
        );
      })}
      {showComparison ? (
        <li className="flex items-center gap-1.5">
          <svg viewBox="0 0 12 2" className="h-0.5 w-3 shrink-0" aria-hidden="true">
            <line
              x1="0"
              y1="1"
              x2="12"
              y2="1"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="3 2"
            />
          </svg>
          {t(UI_KEYS.ui.chart.previous_period)}
        </li>
      ) : null}
    </ul>
  );
}
