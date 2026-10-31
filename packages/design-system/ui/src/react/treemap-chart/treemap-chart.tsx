/**
 * Stackra file contract:
 * Purpose: the web `TreemapChart`: tiles sized by value in the shared squarified layout, painted in the palette with a
 *          2px surface gap and lit softly from the top (flat in a flat brand), each naming itself and its value on a
 *          small surface label; the pointed tile stands while the others dim. The numbers are also a data
 *          table for assistive technology.
 * Boundary: HTML tiles placed with logical `inset-inline-start`, so Arabic starts at the right; labels are real text.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0060 (right-to-left); chart style spec (2026-10-28);
 *          WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";

import { chartColorOf } from "#core/functions/chart-color-of.function";
import { formatChartNumber } from "#core/functions/format-chart-number.function";
import { sortChartItems } from "#core/functions/sort-chart-items.function";
import { treemapLayoutOf } from "#core/functions/treemap-layout-of.function";
import { ChartFrame } from "#react/chart/chart-frame";
import { paintOf } from "#react/chart/paint-of.function";
import { topLitOf } from "#react/chart/top-lit-of.function";
import { useChartLocale } from "#react/chart/use-chart-locale";
import type { TreemapChartProps } from "#react/treemap-chart/treemap-chart.props";

/** Tiles of a whole. */
export function TreemapChart({
  items,
  label,
  valueFormat,
  palette,
  height = 240,
  sort,
  className,
}: TreemapChartProps): ReactElement {
  const { locale, words } = useChartLocale();
  const box = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState(2);
  useEffect(() => {
    const element = box.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 0;
      if (width > 0) setAspect(width / height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [height]);
  const value = (figure: number) => formatChartNumber(figure, locale, valueFormat);
  const table = {
    head: [words.category, words.value],
    rows: items.map((item) => [item.label, value(item.value)]),
  };
  return (
    <ChartFrame label={label} table={table} legend={[]} palette={palette} className={className}>
      <div
        ref={box}
        role="img"
        aria-label={label}
        className="group/treemap relative w-full"
        style={{ height }}
      >
        {treemapLayoutOf(
          sortChartItems(
            items,
            sort,
            (item) => item.value,
            (item) => item.label,
            locale,
          ),
          aspect,
          sort !== undefined,
        ).map((tile) => {
          const color = paintOf(chartColorOf(tile.item, items.indexOf(tile.item), palette));
          return (
            <div
              key={tile.item.key}
              aria-hidden
              // The pointed tile stands while the others dim.
              className="absolute overflow-hidden rounded-[var(--radius-control)] border-2 border-surface p-1.5 transition-opacity duration-(--duration-moderate) group-hover/treemap:opacity-45 hover:opacity-100 motion-reduce:transition-none"
              style={{
                insetInlineStart: `${tile.x}%`,
                top: `${tile.y}%`,
                width: `${tile.width}%`,
                height: `${tile.height}%`,
                backgroundColor: color,
                backgroundImage: `linear-gradient(${topLitOf(color)}, ${color})`,
              }}
            >
              <span className="inline-flex max-w-full flex-col rounded-[var(--radius-control-inner)] bg-surface px-1.5 py-0.5 text-xs">
                <span className="truncate text-muted">{tile.item.label}</span>
                {/* A value wraps rather than truncates: a cut figure would misread. */}
                <span className="font-semibold leading-tight tabular-nums">
                  {value(tile.item.value)}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </ChartFrame>
  );
}
