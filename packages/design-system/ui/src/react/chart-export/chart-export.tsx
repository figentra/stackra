/**
 * Stackra file contract:
 * Purpose: the web `ChartExport`: wraps any chart of the kit with a download button (a menu of PNG, SVG and CSV) at
 *          its reading-end corner. PNG and SVG are the chart's own SVG painted as on screen (`svgSourceOf`,
 *          `svgPngOf`, the PNG on the nearest opaque background); CSV is `data` raw, or the chart's data table as
 *          written.
 * Boundary: the chart is found as the first `svg.recharts-surface` or `svg[data-chart]` inside it; a chart drawn in
 *           HTML only offers CSV. CSV text is guarded against formula injection by `chartCsvOf`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0307 (decisions 14 to 18); WCAG 2.2 SC 2.1.1 and 4.1.2; STA-1371 (gap
 *          wave, 2026-10-31).
 */
import { cn } from "@heroui/react";
import { type ReactElement, useRef } from "react";

import { ChartExportFormat } from "#contracts/enums/chart-export-format.enum";
import type { WidgetData } from "#contracts/types/widget-data.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { WIDGET_MENU_ICON } from "#core/constants/widget-menu-icon.constant";
import { chartCsvOf } from "#core/functions/chart-csv-of.function";
import { ActionMenu } from "#react/action-menu/action-menu";
import type { ChartExportProps } from "#react/chart-export/chart-export.props";
import { useUiText } from "#react/hooks/use-ui-text";
import { downloadFile } from "#react/widget-frame/download-file.function";
import { svgPngOf } from "#react/widget-frame/svg-png-of.function";
import { svgSourceOf } from "#react/widget-frame/svg-source-of.function";

/** The chart's SVG, as WidgetFrame finds it. */
const CHART_SVG = "svg.recharts-surface, svg[data-chart]";

/** One table row's cells as text. */
const cellsOf = (row: Element) => [...row.querySelectorAll("th, td")].map((cell) => cell.textContent ?? "");

/** The chart's data table read back as rows of text. */
function tableDataOf(table: HTMLTableElement): WidgetData {
  const [head, ...rows] = [...table.querySelectorAll("tr")].map(cellsOf);
  return { head: head ?? [], rows };
}

/** The first opaque background at or above `element`, which the PNG is drawn on. */
function backgroundOf(element: Element | null): string {
  for (let at = element; at; at = at.parentElement) {
    const color = getComputedStyle(at).backgroundColor;
    if (color && color !== "transparent" && !/rgba\(.*,\s*0\)$/.test(color)) return color;
  }
  return "transparent";
}

/** A chart with a download menu. */
export function ChartExport({
  children,
  fileName,
  formats = ChartExportFormat,
  data,
  label,
  className,
}: ChartExportProps): ReactElement {
  const t = useUiText();
  const root = useRef<HTMLDivElement>(null);
  const svg = () => root.current?.querySelector(CHART_SVG);
  const run: Record<ChartExportFormat, () => void> = {
    png: () => {
      const chart = svg();
      if (!(chart instanceof SVGSVGElement)) return;
      void svgPngOf(chart, backgroundOf(root.current)).then((blob) => {
        if (blob) downloadFile(blob, `${fileName}.png`);
      });
    },
    svg: () => {
      const chart = svg();
      if (chart instanceof SVGSVGElement)
        downloadFile(
          new Blob([svgSourceOf(chart)], { type: "image/svg+xml;charset=utf-8" }),
          `${fileName}.svg`,
        );
    },
    csv: () => {
      const table = root.current?.querySelector("table[data-slot='chart-table']");
      const rows = data ?? (table instanceof HTMLTableElement ? tableDataOf(table) : undefined);
      if (rows)
        downloadFile(
          new Blob([`\uFEFF${chartCsvOf(rows)}`], { type: "text/csv;charset=utf-8" }),
          `${fileName}.csv`,
        );
    },
  };
  const words = UI_KEYS.ui.widget_frame;
  return (
    <div ref={root} data-slot="chart-export" className={cn("flex w-full min-w-0 flex-col gap-1", className)}>
      <div className="flex justify-end">
        <ActionMenu
          size="sm"
          icon={WIDGET_MENU_ICON.csv}
          label={label ?? t(UI_KEYS.ui.chart.download)}
          sections={[
            {
              id: "export",
              title: label ?? t(UI_KEYS.ui.chart.download),
              isTitleHidden: true,
              items: formats.map((format) => ({
                id: format,
                label: t(words[format]),
                icon: WIDGET_MENU_ICON[format],
                onPress: run[format],
              })),
            },
          ]}
        />
      </div>
      {children}
    </div>
  );
}
