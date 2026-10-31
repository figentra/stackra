/**
 * Stackra file contract:
 * Purpose: the web `ChartTooltip`: the card Recharts shows at the pointed or keyboard-focused row, with the row's
 *          title and one line per series (indicator, label, value written in the locale). Every chart passes it to
 *          Recharts' `<Tooltip content>`; it is exported for a chart composed from Recharts directly.
 * Boundary: HTML in the theme's overlay colours (`bg-overlay`, a `border-separator` edge, `shadow-overlay`, the
 *           theme radius), at least 140px wide; the indicator (a round dot, or a short bar for a line series) is an SVG filled with the series' colour, so no style attribute is written. Flex rows follow the
 *           reading direction; values keep tabular figures.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0291 (ported code); WCAG 2.2 SC 1.4.11; STA-1371.
 *          Portions ported from shadcn/ui (https://github.com/shadcn-ui/ui, apps/v4/registry/new-york-v4/ui/chart.tsx at\n *          96da9cc7f1aa10580a3741664e2a77c721206c00), MIT License, Copyright (c) 2023 shadcn. See THIRD_PARTY_NOTICES.md.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import type { ChartTooltipProps } from "#react/chart-tooltip/chart-tooltip.props";

/** The tooltip card of a chart. */
export function ChartTooltip({
  active,
  payload,
  label,
  formatValue = String,
  formatLabel,
  nameKey,
  indicator = "dot",
}: ChartTooltipProps): ReactElement | null {
  const items = (payload ?? []).filter((item) => item.type !== "none");
  if (!active || items.length === 0) return null;
  const title = formatLabel?.(label);
  return (
    <div
      data-slot="chart-tooltip"
      className="grid min-w-(--size-readout) gap-1.5 rounded-[var(--radius)] border border-separator bg-overlay px-3 py-2 text-overlay-foreground shadow-overlay tabular-nums"
    >
      {title ? <div className="text-xs font-medium text-muted">{title}</div> : null}
      {items.map((item) => {
        const row = item.payload as Readonly<Record<string, unknown>> | undefined;
        const name = nameKey === undefined ? item.name : row?.[nameKey];
        const color = typeof row?.fill === "string" ? row.fill : item.color;
        return (
          <div key={String(item.dataKey ?? name)} className="flex w-full items-center gap-2">
            {indicator === "dot" ? (
              <svg viewBox="0 0 8 8" className="size-2 shrink-0" aria-hidden="true">
                <circle cx="4" cy="4" r="4" fill={color} />
              </svg>
            ) : (
              <svg viewBox="0 0 4 12" className={cn("h-3 w-1 shrink-0")} aria-hidden="true">
                <rect width="4" height="12" rx="2" fill={color} />
              </svg>
            )}
            <span className="flex-1 text-xs text-muted">{String(name ?? "")}</span>
            {typeof item.value === "number" || typeof item.value === "string" ? (
              <span className="text-xs font-semibold text-foreground">
                {typeof item.value === "number" ? formatValue(item.value) : item.value}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
