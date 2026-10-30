/**
 * Stackra file contract:
 * Purpose: the web `SunburstChart`: nested slices as rings, top slices at the centre and their children outwards,
 *          each branch in its top slice's colour with a 2px surface gap between slices; the pointed slice's path and
 *          value read above the plot, the total and `centerLabel` sit in the hole, and every slice is in the table.
 * Boundary: SVG paths from `arcPathOf`; like a pie it is never mirrored. No motion.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import { type ReactElement, useState } from "react";

import { arcPathOf } from "#core/functions/arc-path-of.function";
import { chartColorOf } from "#core/functions/chart-color-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { sunburstLayoutOf } from "#core/functions/sunburst-layout-of.function";
import type { SunburstArc } from "#core/types/sunburst-arc.type";
import { CHART_PAINT } from "#react/chart/chart-paint.constant";
import { ChartFrame } from "#react/chart/chart-frame";
import { paintOf } from "#react/chart/paint-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import type { SunburstChartProps } from "#react/sunburst-chart/sunburst-chart.props";

/** The separator between the levels of a slice's path. */
const TRAIL = " › ";

/** Whether `arc` is the pointed slice, one of its parents or one of its children. */
const isOnPath = (arc: SunburstArc, active: SunburstArc) => {
  const [short, long] = arc.keys.length <= active.keys.length ? [arc, active] : [active, arc];
  return short.keys.every((part, index) => long.keys[index] === part);
};

/** Nested shares as rings. */
export function SunburstChart({
  items,
  label,
  valueFormat,
  palette,
  size = 260,
  centerLabel,
  className,
}: SunburstChartProps): ReactElement {
  const { locale, words } = useChartLocale();
  const [active, setActive] = useState<SunburstArc | null>(null);
  const arcs = sunburstLayoutOf(items);
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const rings = Math.max(1, ...arcs.map((arc) => arc.depth + 1));
  const outer = size / 2 - 2;
  const hole = outer * (centerLabel ? 0.44 : 0.16);
  const band = (outer - hole) / rings;
  const total = arcs.filter((arc) => arc.depth === 0).reduce((sum, arc) => sum + arc.value, 0);
  const table = {
    head: [words.category, words.value],
    rows: arcs.map((arc) => [arc.trail.join(TRAIL), value(arc.value)]),
  };
  return (
    <ChartFrame label={label} table={table} legend={[]} className={className}>
      <p aria-hidden="true" className="m-0 min-h-5 text-center text-xs text-muted">
        {active ? (
          <>
            {active.trail.join(TRAIL)}{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {value(active.value)}
            </span>
          </>
        ) : null}
      </p>
      <div className="relative mx-auto" style={{ width: size, height: size }}>
        <svg
          role="img"
          aria-label={label}
          viewBox={`0 0 ${size} ${size}`}
          className="size-full"
          onPointerLeave={() => setActive(null)}
        >
          {arcs.map((arc) => (
            <path
              key={arc.keys.join("/")}
              d={arcPathOf(
                size / 2,
                size / 2,
                hole + band * arc.depth,
                hole + band * (arc.depth + 1),
                arc.start,
                arc.end,
              )}
              fill={paintOf(chartColorOf(items[arc.branch], arc.branch, palette))}
              stroke={CHART_PAINT.surface}
              strokeWidth={2}
              opacity={active && !isOnPath(arc, active) ? 0.45 : 1}
              onPointerEnter={() => setActive(arc)}
            />
          ))}
          {/* The centre's words are SVG text, as every chart's are: an HTML label over the SVG left axe no ground to
              measure it against, and right-to-left words broke into runs over different arcs. */}
          {centerLabel ? (
            <g aria-hidden="true" textAnchor="middle" className="pointer-events-none">
              <text
                x={size / 2}
                y={size / 2 - 2}
                fill={paintOf("foreground")}
                className="text-lg font-bold tabular-nums"
              >
                {value(total)}
              </text>
              <text x={size / 2} y={size / 2 + 16} fill={paintOf("muted")} className="text-xs">
                {centerLabel}
              </text>
            </g>
          ) : null}
        </svg>
      </div>
    </ChartFrame>
  );
}
