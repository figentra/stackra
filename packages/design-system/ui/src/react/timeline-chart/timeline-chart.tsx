/**
 * Stackra file contract:
 * Purpose: the web `TimelineChart` (a gantt): one lane per row with its name at the reading start, each task a bar
 *          from its start to its end day with its name on a surface chip, month or week ticks along the top, faint
 *          tick lines through the lanes, a dashed "Today" line, and every task in the data table.
 * Boundary: HTML placed with `inset-inline-start` in percent of the span, so time runs right to left in Arabic with no
 *           code of its own. Colours are theme variables. No motion.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1 and 1.4.11;
 *          STA-1371.
 */
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { chartColorOf } from "#core/functions/chart-color-of.function";
import { formatChartCategory } from "#core/functions/format-chart-category.function";
import { timelineLayoutOf } from "#core/functions/timeline-layout-of.function";
import { ChartFrame } from "#react/chart/chart-frame";
import { paintOf } from "#react/chart/paint-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import { useUiText } from "#react/hooks/use-ui-text";
import type { TimelineChartProps } from "#react/timeline-chart/timeline-chart.props";

/** The task dates' default format. */
const DAY_FORMAT: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

/** Lanes of tasks over time. */
export function TimelineChart({
  rows,
  tasks,
  label,
  today,
  dateFormat = DAY_FORMAT,
  className,
}: TimelineChartProps): ReactElement {
  const { locale } = useChartLocale();
  const t = useUiText();
  const K = UI_KEYS.ui.chart;
  const layout = timelineLayoutOf(rows, tasks, today);
  const date = (iso: string) => formatChartCategory(iso, locale, dateFormat);
  const tick = (time: number) =>
    formatChartCategory(time, locale, layout.unit === "month" ? { month: "short" } : DAY_FORMAT);
  const table = {
    head: [t(K.task), t(K.lane), t(K.start), t(K.end)],
    rows: layout.bars.map(({ task, row }) => [
      task.label,
      rows[row]?.label ?? "",
      date(task.start),
      date(task.end),
    ]),
  };
  const lines = layout.ticks.map(({ date: time, at }) => (
    <span
      key={time}
      className="absolute inset-y-0 border-s border-separator/60"
      style={{ insetInlineStart: `${at * 100}%` }}
    />
  ));
  return (
    <ChartFrame label={label} table={table} legend={[]} className={className}>
      <div
        role="img"
        aria-label={label}
        className="grid grid-cols-[minmax(0,7rem)_1fr] gap-x-3 text-xs"
      >
        <span />
        <div className="relative h-5">
          {layout.ticks.map(({ date: time, at }) => (
            <span
              key={time}
              aria-hidden="true"
              className="absolute top-0 ps-1 text-muted whitespace-nowrap"
              style={{ insetInlineStart: `${at * 100}%` }}
            >
              {tick(time)}
            </span>
          ))}
        </div>
        {rows.map((row, index) => (
          <div key={row.key} className="contents">
            <span aria-hidden="true" className="self-center truncate py-2 text-muted">
              {row.label}
            </span>
            <div className="relative h-10 border-t border-separator/60">
              {lines}
              {layout.bars
                .filter((bar) => bar.row === index)
                .map(({ task, at, length }) => (
                  <span
                    key={task.key}
                    aria-hidden="true"
                    title={`${task.label}: ${date(task.start)} – ${date(task.end)}`}
                    className="absolute top-2 flex h-6 items-center overflow-hidden rounded-[var(--radius-control)] px-1"
                    style={{
                      insetInlineStart: `${at * 100}%`,
                      width: `${length * 100}%`,
                      backgroundColor: paintOf(chartColorOf(task, 0)),
                    }}
                  >
                    <span className="truncate rounded-[var(--radius-control-inner)] bg-surface/85 px-1.5 leading-5">
                      {task.label}
                    </span>
                  </span>
                ))}
              {layout.today === null ? null : (
                <span
                  className="absolute inset-y-0 border-s-2 border-dashed border-muted"
                  style={{ insetInlineStart: `${layout.today * 100}%` }}
                />
              )}
            </div>
          </div>
        ))}
        {layout.today === null ? null : (
          <>
            <span />
            <div className="relative h-5">
              <span
                aria-hidden="true"
                className="absolute top-0.5 -translate-x-1/2 text-muted rtl:translate-x-1/2"
                style={{ insetInlineStart: `${layout.today * 100}%` }}
              >
                {t(K.today)}
              </span>
            </div>
          </>
        )}
      </div>
    </ChartFrame>
  );
}
