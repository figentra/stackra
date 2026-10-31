/**
 * Stackra file contract:
 * Purpose: the web `ChordDiagram`: groups as arcs round a ring, each as long as all that leaves and reaches it, and
 *          each flow as a ribbon through the middle in its source's colour (`chordLayoutOf`); every group named outside
 *          its arc. Pointing at a group lights its ribbons. The flows also as a data table (from, to, value).
 * Boundary: a square SVG of `size`, so the ring stays round; labels are SVG text, so Arabic is shaped by the browser.
 *           Like a pie, it reads clockwise from the top and is never mirrored. No motion.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371 (gap wave,
 *          2026-10-31).
 */
import { type ReactElement, useState } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { chartColorOf } from "#core/functions/chart-color-of.function";
import { chordLayoutOf } from "#core/functions/chord-layout-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { ChartFrame } from "#react/chart/chart-frame";
import { paintOf } from "#react/chart/paint-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import { useUiText } from "#react/hooks/use-ui-text";
import type { ChordDiagramProps } from "#react/chord-diagram/chord-diagram.props";

/** The room kept round the ring for the groups' names. */
const LABEL_ROOM = 64;

/** Flows between groups round a circle. */
export function ChordDiagram({
  nodes,
  links,
  label,
  valueFormat,
  palette,
  size = 320,
  className,
}: ChordDiagramProps): ReactElement {
  const { locale, isRtl, words } = useChartLocale();
  const t = useUiText();
  const [active, setActive] = useState<number | null>(null);
  const centre = size / 2;
  const outer = centre - LABEL_ROOM;
  const layout = chordLayoutOf(nodes, links, { cx: centre, cy: centre, inner: outer - 10, outer });
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const colorOf = (index: number) => paintOf(chartColorOf(nodes[index], index, palette));
  const nameOf = (key: string) => nodes.find((node) => node.key === key)?.label ?? key;
  const table = {
    head: [t(UI_KEYS.ui.chart.from), t(UI_KEYS.ui.chart.to), words.value],
    rows: layout.ribbons.map(({ link }) => [
      nameOf(link.source),
      nameOf(link.target),
      value(link.value),
    ]),
  };
  return (
    <ChartFrame label={label} table={table} legend={[]} className={className}>
      <div className="mx-auto w-full" style={{ maxWidth: size }}>
        <svg
          role="img"
          aria-label={label}
          data-chart="chord-diagram"
          viewBox={`0 0 ${size} ${size}`}
          className="block size-full overflow-visible"
          onPointerLeave={() => setActive(null)}
        >
          {layout.ribbons.map((ribbon) => {
            const isLit =
              active === null ||
              ribbon.sourceIndex === active ||
              nodes[active]?.key === ribbon.link.target;
            return (
              <path
                key={`${ribbon.link.source}-${ribbon.link.target}`}
                d={ribbon.path}
                fill={colorOf(ribbon.sourceIndex)}
                fillOpacity={isLit ? 0.55 : 0.08}
              >
                <title>{`${nameOf(ribbon.link.source)} → ${nameOf(ribbon.link.target)}: ${value(ribbon.link.value)}`}</title>
              </path>
            );
          })}
          {layout.groups.map((group) => {
            if (group.value <= 0) return null;
            const middle = (group.start + group.end) / 2;
            const lean = Math.sin(middle);
            // A name runs away from the ring; in right-to-left SVG text "start" is the right edge, so the anchors swap.
            const outward = lean > 0.1 ? "start" : lean < -0.1 ? "end" : "middle";
            const anchor =
              isRtl && outward !== "middle" ? (outward === "start" ? "end" : "start") : outward;
            const x = centre + (outer + 8) * Math.sin(middle);
            const y = centre - (outer + 8) * Math.cos(middle);
            return (
              <g key={group.node.key} onPointerEnter={() => setActive(group.index)}>
                <path d={group.path} fill={colorOf(group.index)}>
                  <title>{`${group.node.label}: ${value(group.value)}`}</title>
                </path>
                <text
                  x={x}
                  y={y}
                  dy="0.35em"
                  textAnchor={anchor}
                  fill={paintOf("foreground")}
                  aria-hidden="true"
                  className="text-xs"
                >
                  {group.node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </ChartFrame>
  );
}
