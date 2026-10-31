/**
 * Stackra file contract:
 * Purpose: the web `TreeDiagram`: a hierarchy as a node-link tree laid out by `treeLayoutOf`: levels in columns from
 *          the reading start, a dot per node with its name (and figure) after it, curves from each parent to its
 *          children, each branch in its own colour. Every node also in a data table with its path and figure.
 * Boundary: SVG at the measured width (`usePlotWidth`), so dots stay round; labels are SVG text on a halo of the
 *           surface, so they read over the curves and Arabic is shaped by the browser. Mirrors right to left. No motion.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1 and 1.4.11;
 *          STA-1371 (gap wave, 2026-10-31).
 */
import type { ReactElement } from "react";

import { chartColorOf } from "#core/functions/chart-color-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { treeLayoutOf } from "#core/functions/tree-layout-of.function";
import { CHART_PAINT } from "#react/chart/chart-paint.constant";
import { ChartFrame } from "#react/chart/chart-frame";
import { paintOf } from "#react/chart/paint-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import { usePlotWidth } from "#react/chart/use-plot-width";
import type { TreeDiagramProps } from "#react/tree-diagram/tree-diagram.props";

/** The separator of a node's path in the data table. */
const TRAIL = " › ";
/** A leaf's row height when no height is given. */
const ROW = 28;

/** Count the leaves under a forest. */
const leavesOf = (items: TreeDiagramProps["items"]): number =>
  items.reduce((sum, item) => sum + (item.children?.length ? leavesOf(item.children) : 1), 0);

/** A hierarchy as a tree. */
export function TreeDiagram({
  items,
  label,
  valueFormat,
  palette,
  height,
  className,
}: TreeDiagramProps): ReactElement {
  const { locale, isRtl, words } = useChartLocale();
  const { width, ref } = usePlotWidth();
  const tall = height ?? Math.max(ROW * 2, leavesOf(items) * ROW);
  const layout = treeLayoutOf(items, { width, height: tall, isRtl, padding: 8, labelRoom: 140 });
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const colorOf = (branch: number) =>
    branch < 0 ? paintOf("muted") : paintOf(chartColorOf(undefined, branch, palette));
  const table = {
    head: [words.category, words.value],
    rows: layout.nodes.map((node) => [
      node.trail.join(TRAIL),
      node.value === undefined ? "" : value(node.value),
    ]),
  };
  return (
    <ChartFrame label={label} table={table} legend={[]} className={className}>
      <div ref={ref} className="w-full">
        <svg
          role="img"
          aria-label={label}
          data-chart="tree-diagram"
          width={width}
          height={tall}
          viewBox={`0 0 ${width} ${tall}`}
          className="block overflow-visible"
        >
          {layout.links.map((link) => (
            <path
              key={link.key}
              d={link.path}
              fill="none"
              stroke={colorOf(link.branch)}
              strokeOpacity={0.5}
              strokeWidth={1.5}
            />
          ))}
          {layout.nodes.map((node) => {
            const color = node.item.color ? paintOf(node.item.color) : colorOf(node.branch);
            // A leaf's name runs toward the reading end; a parent's sits before its dot, over its own curve start.
            const isAfter = node.isLeaf || node.depth === 0;
            const side = isAfter !== isRtl ? 1 : -1;
            return (
              <g key={node.item.key}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.isLeaf ? 4 : 5}
                  fill={node.isLeaf ? CHART_PAINT.surface : color}
                  stroke={color}
                  strokeWidth={2}
                />
                <text
                  x={node.x + side * 10}
                  y={node.y}
                  dy="0.35em"
                  // In right-to-left SVG text "start" is the right edge, so a label after its dot always anchors at its start.
                  textAnchor={isAfter ? "start" : "end"}
                  fill={paintOf("foreground")}
                  stroke={CHART_PAINT.surface}
                  strokeWidth={4}
                  paintOrder="stroke"
                  aria-hidden="true"
                  className="text-xs"
                >
                  {node.item.label}
                  {node.value === undefined ? null : (
                    <tspan fill={paintOf("muted")} className="tabular-nums">
                      {` ${value(node.value)}`}
                    </tspan>
                  )}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </ChartFrame>
  );
}
