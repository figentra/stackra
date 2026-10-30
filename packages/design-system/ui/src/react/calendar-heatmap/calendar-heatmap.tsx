/**
 * Stackra file contract:
 * Purpose: the web `CalendarHeatmap`: an activity graph with one cell per day and a column per week (the locale's
 *          first weekday on top), shaded in five steps by the day's value, month names over the weeks they start,
 *          weekday names at the reading start, a readout of the pointed day, the "Less … More" scale, and the days
 *          with a value as a data table.
 * Boundary: HTML with flex, so the weeks run right to left in Arabic on their own; the shades are `color-mix()` of
 *           theme colours; dates are calendar days in UTC. Wide ranges scroll sideways inside the figure.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import { cn } from "@heroui/react";
import { type ReactElement, useState } from "react";

import { calendarWeeksOf } from "#core/functions/calendar-weeks-of.function";
import { formatChartCategory } from "#core/functions/format-chart-category.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { heatLevelOf } from "#core/functions/heat-level-of.function";
import { weekStartOf } from "#core/functions/week-start-of.function";
import type { CalendarHeatmapProps } from "#react/calendar-heatmap/calendar-heatmap.props";
import { ChartFrame } from "#react/chart/chart-frame";
import { HeatScale } from "#react/chart/heat-scale";
import { heatShadeOf } from "#react/chart/heat-shade-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";

/** Days as shaded cells, a column per week. */
export function CalendarHeatmap({
  values,
  start,
  end,
  label,
  valueFormat,
  color = "chart-ramp-1",
  weekStart,
  showLegend = true,
  className,
}: CalendarHeatmapProps): ReactElement {
  const { locale, words } = useChartLocale();
  // oxlint-disable-next-line unicorn/no-array-sort -- a fresh array from map, sorted in place
  const dates = values.map((item) => item.date.slice(0, 10)).sort();
  // No days and no range draws an empty calendar.
  const first = start ?? dates[0] ?? end ?? "";
  const last = end ?? dates.at(-1) ?? first;
  const weeks = calendarWeeksOf(values, first, last, weekStart ?? weekStartOf(locale));
  const shown = weeks.flat().filter((day) => day.isInRange && day.value !== null);
  const min = Math.min(...shown.map((day) => day.value ?? 0));
  const max = Math.max(...shown.map((day) => day.value ?? 0));
  const [pointed, setPointed] = useState<string | null>(null);
  const day = (date: string) =>
    formatChartCategory(date, locale, { weekday: "short", day: "numeric", month: "short" });
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const pointedDay = weeks.flat().find((item) => item.date === pointed);
  const weekday = (offset: number) =>
    formatChartCategory(weeks[0]?.[offset]?.date, locale, { weekday: "short" });
  const table = {
    head: [words.category, words.value],
    rows: shown.map((item) => [day(item.date), value(item.value ?? 0)]),
  };
  return (
    <ChartFrame label={label} table={table} legend={[]} className={className}>
      <div role="img" aria-label={label} className="flex flex-col gap-2">
        <p aria-hidden="true" className="m-0 min-h-4 text-xs text-muted tabular-nums">
          {pointedDay
            ? `${day(pointedDay.date)}: ${pointedDay.value === null ? "–" : value(pointedDay.value)}`
            : ""}
        </p>
        <div
          className="flex gap-[3px] overflow-x-auto pb-1"
          onPointerLeave={() => setPointed(null)}
        >
          <div
            aria-hidden="true"
            className="flex shrink-0 flex-col gap-[3px] pe-1 pt-4 text-[10px] text-muted"
          >
            {[0, 1, 2, 3, 4, 5, 6].map((offset) => (
              <span key={offset} className="h-3 leading-3">
                {offset % 2 === 1 ? weekday(offset) : ""}
              </span>
            ))}
          </div>
          {weeks.map((week, index) => {
            const firstOfMonth = week.find((item) => item.isInRange && item.date.endsWith("-01"));
            const month =
              firstOfMonth || index === 0
                ? formatChartCategory(
                    (firstOfMonth ?? week.find((item) => item.isInRange))?.date,
                    locale,
                    {
                      month: "short",
                    },
                  )
                : "";
            return (
              <div key={week[0]?.date ?? index} className="flex shrink-0 flex-col gap-[3px]">
                <span
                  aria-hidden="true"
                  className="h-3 w-3 overflow-visible text-[10px] leading-3 whitespace-nowrap text-muted"
                >
                  {month}
                </span>
                {week.map((item) => (
                  <span
                    key={item.date}
                    aria-hidden="true"
                    onPointerEnter={() => setPointed(item.isInRange ? item.date : null)}
                    className={cn(
                      "size-3 rounded-[var(--radius-control-inner)] outline-offset-1",
                      !item.isInRange && "invisible",
                      pointed === item.date && "outline-2 outline-foreground",
                    )}
                    style={{
                      backgroundColor: heatShadeOf(heatLevelOf(item.value, min, max), color),
                    }}
                  />
                ))}
              </div>
            );
          })}
        </div>
        {showLegend ? <HeatScale color={color} /> : null}
      </div>
    </ChartFrame>
  );
}
