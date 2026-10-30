/**
 * Stackra file contract:
 * Purpose: the web `SankeyChart`: nodes as bars in columns and flows as bands between them, each band in its source's
 *          colour, every node named with its total; the flows also as a data table (from, to, value).
 * Boundary: SVG laid out by `sankeyLayoutOf` in a 1000-wide box stretched to the width (bands and bars only, so nothing
 *           warps); labels are HTML placed by percent, so Arabic is shaped by the browser. Columns run from the
 *           reading start. No motion.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1 and 1.4.11;
 *          STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { chartColorOf } from "#core/functions/chart-color-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { sankeyLayoutOf } from "#core/functions/sankey-layout-of.function";
import { ChartFrame } from "#react/chart/chart-frame";
import { paintOf } from "#react/chart/paint-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import { useUiText } from "#react/hooks/use-ui-text";
import type { SankeyChartProps } from "#react/sankey-chart/sankey-chart.props";

/** The layout box's width; the SVG stretches it to the figure's. */
const WIDTH = 1000;

/** Flows between stages. */
export function SankeyChart({
  nodes,
  links,
  label,
  valueFormat,
  palette,
  height = 280,
  className,
}: SankeyChartProps): ReactElement {
  const { locale, isRtl, words } = useChartLocale();
  const t = useUiText();
  const layout = sankeyLayoutOf(nodes, links, { width: WIDTH, height, isRtl });
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const colorOf = (index: number) => paintOf(chartColorOf(nodes[index], index, palette));
  const nameOf = (key: string) => nodes.find((node) => node.key === key)?.label ?? key;
  const table = {
    head: [t(UI_KEYS.ui.chart.from), t(UI_KEYS.ui.chart.to), words.value],
    rows: layout.links.map(({ link }) => [
      nameOf(link.source),
      nameOf(link.target),
      value(link.value),
    ]),
  };
  return (
    <ChartFrame label={label} table={table} legend={[]} className={className}>
      <div role="img" aria-label={label} className="relative w-full" style={{ height }}>
        <svg
          viewBox={`0 0 ${WIDTH} ${height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full overflow-visible"
          aria-hidden="true"
        >
          {layout.links.map(({ link, sourceIndex, path }) => (
            <path
              key={`${link.source}-${link.target}`}
              d={path}
              fill={colorOf(sourceIndex)}
              className="opacity-30 transition-opacity duration-150 hover:opacity-60 motion-reduce:transition-none"
            >
              <title>{`${nameOf(link.source)} → ${nameOf(link.target)}: ${value(link.value)}`}</title>
            </path>
          ))}
          {layout.nodes.map((node) =>
            node.height > 0 ? (
              <rect
                key={node.node.key}
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                rx={2}
                fill={colorOf(node.index)}
              />
            ) : null,
          )}
        </svg>
        {layout.nodes.map((node) => {
          if (node.height <= 0) return null;
          // A label sits after its node, toward the reading end; the last column's sits before it.
          const isLast = node.column === layout.columns - 1 && layout.columns > 1;
          const isRight = isRtl === isLast;
          const edge = isRight ? (node.x + node.width) / WIDTH : (WIDTH - node.x) / WIDTH;
          return (
            <span
              key={node.node.key}
              aria-hidden="true"
              className={cn(
                // On a plate of the surface: text over the SVG leaves axe no ground to measure it against.
                "absolute flex -translate-y-1/2 flex-col rounded-[var(--radius-control-inner)] bg-surface py-0.5 text-xs leading-tight whitespace-nowrap",
                isRight ? "items-start text-left" : "items-end text-right",
              )}
              style={{
                top: node.y + node.height / 2,
                ...(isRight
                  ? { left: `${edge * 100}%`, paddingLeft: 6 }
                  : { right: `${edge * 100}%`, paddingRight: 6 }),
              }}
            >
              <span className="text-muted">{node.node.label}</span>
              <span className="font-semibold tabular-nums">{value(node.value)}</span>
            </span>
          );
        })}
      </div>
    </ChartFrame>
  );
}
