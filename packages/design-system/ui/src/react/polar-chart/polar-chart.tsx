/**
 * Stackra file contract:
 * Purpose: the web `PolarChart`, a polar area (Nightingale rose) chart: one equal-angle sector per row clockwise from
 *          the top, its radius the value against the largest, split into one slice per series in its theme colour;
 *          four grid rings, the sector names round the edge, the chart tooltip at the pointed sector, the legend and
 *          the data table.
 * Boundary: SVG paths from the shared `arcPathOf` and `polarSectorsOf`, as the sunburst draws (Recharts has no polar
 *           area); never mirrored, but the names' anchors follow the reading direction so Arabic sits outside the
 *           ring. No motion. The table and the image's name carry every number for assistive technology.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371 (wave D, owner
 *          approval 2026-10-30).
 */
import { type ReactElement, useState } from "react";

import { arcPathOf } from "#core/functions/arc-path-of.function";
import { chartColorOf } from "#core/functions/chart-color-of.function";
import { chartTableOf } from "#core/functions/chart-table-of.function";
import { formatChartCategory } from "#core/functions/format-chart-category.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { polarSectorsOf } from "#core/functions/polar-sectors-of.function";
import { ChartFrame } from "#react/chart/chart-frame";
import { CHART_PAINT } from "#react/chart/chart-paint.constant";
import { paintOf } from "#react/chart/paint-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import { ChartTooltip } from "#react/chart-tooltip/chart-tooltip";
import type { PolarChartProps } from "#react/polar-chart/polar-chart.props";

/** The grid's rings, the room above and below the ring for the names, and the room beside it. */
const STEPS = 4;
const LABEL_ROOM = 24;
const SIDE_ROOM = 72;

/** Sectors whose radius is their value. */
export function PolarChart(props: PolarChartProps): ReactElement {
  const { data, series, label, xKey, xFormat, valueFormat, height = 280 } = props;
  const { locale, isRtl, words } = useChartLocale();
  const [active, setActive] = useState<number | null>(null);
  const category = (value: unknown) => formatChartCategory(value, locale, xFormat);
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const table = chartTableOf({
    data,
    series,
    categoryKey: xKey,
    locale,
    valueFormat,
    categoryFormat: xFormat,
    words,
  });
  const sectors = polarSectorsOf(data, series);
  const width = height + SIDE_ROOM * 2;
  const centre = { x: width / 2, y: height / 2 };
  const outer = Math.max(0, height / 2 - LABEL_ROOM);
  const step = (Math.PI * 2) / Math.max(1, data.length);
  const colors = series.map((item, index) => paintOf(chartColorOf(item, index, props.palette)));
  const pointAt = (angle: number, radius: number) => ({
    x: centre.x + Math.sin(angle) * radius,
    y: centre.y - Math.cos(angle) * radius,
  });
  const activeRow = active === null ? undefined : data[active];
  const tip = active === null ? undefined : pointAt((active + 0.5) * step, outer * 0.55);
  return (
    <ChartFrame
      label={label}
      table={table}
      legend={(props.showLegend ?? series.length > 1) ? series : []}
      palette={props.palette}
      className={props.className}
    >
      <div className="relative mx-auto w-full" style={{ maxWidth: width }}>
        <svg
          role="img"
          aria-label={label}
          viewBox={`0 0 ${width} ${height}`}
          className="block h-auto w-full overflow-visible"
          onPointerLeave={() => setActive(null)}
        >
          {Array.from({ length: STEPS }, (_, ring) => (
            <circle
              key={ring}
              cx={centre.x}
              cy={centre.y}
              r={(outer * (ring + 1)) / STEPS}
              fill="none"
              {...CHART_PAINT.grid}
            />
          ))}
          {data.map((row, index) => {
            const edge = pointAt(index * step, outer);
            return (
              <line
                key={`spoke-${String(row[xKey])}`}
                x1={centre.x}
                y1={centre.y}
                x2={edge.x}
                y2={edge.y}
                {...CHART_PAINT.grid}
              />
            );
          })}
          {sectors.map((sector) =>
            sector.share > 0 ? (
              <path
                key={`${sector.row}-${sector.series}`}
                d={arcPathOf(centre.x, centre.y, 0, outer * sector.share, sector.start, sector.end)}
                fill={colors[sector.series]}
                stroke={CHART_PAINT.surface}
                strokeWidth={1.5}
                opacity={active !== null && active !== sector.row ? 0.45 : 1}
              />
            ) : null,
          )}
          {/* Hit areas: the whole sector answers the pointer, not only its filled part. */}
          {data.map((row, index) => (
            <path
              key={`hit-${String(row[xKey])}`}
              d={arcPathOf(centre.x, centre.y, 0, outer, index * step, (index + 1) * step)}
              fill="transparent"
              onPointerEnter={() => setActive(index)}
              className="[pointer-events:visibleFill]"
              aria-hidden="true"
            />
          ))}
          <g aria-hidden="true" className="pointer-events-none">
            {data.map((row, index) => {
              const middle = (index + 0.5) * step;
              const at = pointAt(middle, outer + 12);
              const side = Math.sin(middle);
              // `start` and `end` follow the text's direction, so in Arabic they swap to keep the name outside.
              const outward = side > 0 === !isRtl ? "start" : "end";
              return (
                <text
                  key={`name-${String(row[xKey])}`}
                  x={at.x}
                  y={at.y}
                  textAnchor={Math.abs(side) < 0.15 ? "middle" : outward}
                  dominantBaseline="middle"
                  {...CHART_PAINT.tick}
                >
                  {category(row[xKey])}
                </text>
              );
            })}
          </g>
        </svg>
        {props.showTooltip !== false && activeRow && tip ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${(tip.x / width) * 100}%`, top: `${(tip.y / height) * 100}%` }}
          >
            <ChartTooltip
              active
              label={activeRow[xKey]}
              formatLabel={category}
              formatValue={value}
              payload={series.map((item, index) => ({
                name: item.label,
                value: activeRow[item.key],
                color: colors[index],
                dataKey: item.key,
              }))}
            />
          </div>
        ) : null}
      </div>
    </ChartFrame>
  );
}
