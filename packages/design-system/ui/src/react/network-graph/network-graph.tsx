/**
 * Stackra file contract:
 * Purpose: the web `NetworkGraph`: nodes as circles joined by lines, laid out by `networkLayoutOf`, each node coloured
 *          by its group and named under it; pointing at a node lights it and its links and fades the rest. The links
 *          also as a data table (from, to, value).
 * Boundary: SVG at the measured width (`usePlotWidth`), so circles stay round; labels are SVG text, so Arabic is shaped
 *           by the browser. The layout mirrors right to left. No motion.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1 and 1.4.11;
 *          STA-1371 (gap wave, 2026-10-31).
 */
import { type ReactElement, useState } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { chartColorOf } from "#core/functions/chart-color-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { networkLayoutOf } from "#core/functions/network-layout-of.function";
import { CHART_PAINT } from "#react/chart/chart-paint.constant";
import { ChartFrame } from "#react/chart/chart-frame";
import { paintOf } from "#react/chart/paint-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import { usePlotWidth } from "#react/chart/use-plot-width";
import { useUiText } from "#react/hooks/use-ui-text";
import type { NetworkGraphProps } from "#react/network-graph/network-graph.props";

/** Who is linked to whom. */
export function NetworkGraph({
  nodes,
  links,
  label,
  valueFormat,
  palette,
  height = 320,
  className,
}: NetworkGraphProps): ReactElement {
  const { locale, isRtl, words } = useChartLocale();
  const t = useUiText();
  const { width, ref } = usePlotWidth();
  const [active, setActive] = useState<number | null>(null);
  const layout = networkLayoutOf(nodes, links, { width, height, isRtl });
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const colorOf = (index: number) =>
    paintOf(chartColorOf(nodes[index], layout.nodes[index]?.colorIndex ?? index, palette));
  const isNear = (index: number) =>
    active === null ||
    index === active ||
    layout.links.some(
      (line) =>
        (line.sourceIndex === active && line.targetIndex === index) ||
        (line.targetIndex === active && line.sourceIndex === index),
    );
  const table = {
    head: [t(UI_KEYS.ui.chart.from), t(UI_KEYS.ui.chart.to), words.value],
    rows: layout.links.map(({ link, sourceIndex, targetIndex }) => [
      nodes[sourceIndex]?.label ?? link.source,
      nodes[targetIndex]?.label ?? link.target,
      value(link.value ?? 1),
    ]),
  };
  return (
    <ChartFrame label={label} table={table} legend={[]} className={className}>
      <div ref={ref} className="w-full">
        <svg
          role="img"
          aria-label={label}
          data-chart="network-graph"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block overflow-visible"
          onPointerLeave={() => setActive(null)}
        >
          {layout.links.map((line) => (
            <line
              key={`${line.link.source}-${line.link.target}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={paintOf("muted")}
              strokeWidth={line.width}
              strokeOpacity={
                active === null ? 0.4 : line.sourceIndex === active || line.targetIndex === active ? 0.8 : 0.1
              }
            />
          ))}
          {layout.nodes.map((point, index) => (
            <g
              key={point.node.key}
              opacity={isNear(index) ? 1 : 0.25}
              onPointerEnter={() => setActive(index)}
            >
              <title>{`${point.node.label}: ${value(point.node.value ?? point.degree)}`}</title>
              <circle
                cx={point.x}
                cy={point.y}
                r={point.radius}
                fill={colorOf(index)}
                stroke={CHART_PAINT.surface}
                strokeWidth={2}
              />
              <text
                x={point.x}
                y={point.y + point.radius + 12}
                textAnchor="middle"
                fill={paintOf("foreground")}
                aria-hidden="true"
                className="text-xs"
              >
                {point.node.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </ChartFrame>
  );
}
