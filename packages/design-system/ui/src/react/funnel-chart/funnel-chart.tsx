/**
 * Stackra file contract:
 * Purpose: the web `FunnelChart`: one row per step, the step's name at the reading start, a centred bar as wide as its
 *          share of the first step (lit softly from the top, flat in a flat brand; the pointed bar stands while the
 *          others dim), its value and its conversion from the step before at the end.
 * Boundary: HTML, not SVG: every number is real text in the page's direction and shaping, so the list is its own
 *           accessible description. The bar's colour is a theme variable; widths ease only without reduced motion.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0060 (right-to-left); chart style spec (2026-10-28);
 *          WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { funnelRowsOf } from "#core/functions/funnel-rows-of.function";
import { sortChartItems } from "#core/functions/sort-chart-items.function";
import { paintOf } from "#react/chart/paint-of.function";
import { topLitOf } from "#react/chart/top-lit-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import type { FunnelChartProps } from "#react/funnel-chart/funnel-chart.props";
import { useUiText } from "#react/hooks/use-ui-text";

/** A funnel of steps. */
export function FunnelChart({
  stages,
  label,
  valueFormat,
  color = "chart-ramp-1",
  showConversion = true,
  sort,
  className,
}: FunnelChartProps): ReactElement {
  const { locale } = useChartLocale();
  const t = useUiText();
  const percent = (value: number) =>
    formatChartNumber(value, locale, { style: "percent", maximumFractionDigits: 1 });
  return (
    <figure
      data-slot="funnel-chart"
      className={cn("m-0 flex w-full min-w-0 flex-col gap-2", className)}
    >
      <figcaption className="sr-only">{label}</figcaption>
      <ol className="group/funnel m-0 flex list-none flex-col gap-2 p-0">
        {sortChartItems(
          funnelRowsOf(stages),
          sort,
          (row) => row.stage.value,
          (row) => row.stage.label,
          locale,
        ).map(({ stage, share, conversion }) => (
          <li
            key={stage.key}
            className="group/stage grid grid-cols-[minmax(0,8rem)_1fr_auto] items-center gap-3"
          >
            <span className="truncate text-xs text-muted">{stage.label}</span>
            <span
              aria-hidden
              className="flex h-7 justify-center rounded-[var(--radius-control-inner)] bg-default/40"
            >
              <span
                // The pointed stage's bar stands while the others dim.
                className="h-full rounded-[var(--radius-control-inner)] transition-[width,opacity] duration-300 group-hover/funnel:opacity-45 group-hover/stage:opacity-100 motion-reduce:transition-none"
                style={{
                  width: `${Math.max(share * 100, 1)}%`,
                  backgroundColor: paintOf(color),
                  backgroundImage: `linear-gradient(${topLitOf(paintOf(color))}, ${paintOf(color)})`,
                }}
              />
            </span>
            <span className="flex flex-col items-end text-end">
              <span className="text-sm font-semibold tabular-nums">
                {formatChartNumber(stage.value, locale, valueFormat)}
              </span>
              {showConversion && conversion !== null ? (
                <span className="text-xs text-muted tabular-nums">
                  {t(UI_KEYS.ui.funnel_chart.conversion, { value: percent(conversion) })}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
