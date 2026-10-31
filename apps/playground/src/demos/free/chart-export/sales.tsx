/**
 * Stackra file contract:
 * Purpose: the "sales" demo of the web ChartExport: a month-by-month bar chart with a download menu: PNG, SVG and CSV on web, image and CSV shared on a phone.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (gap wave, owner approval 2026-10-31).
 */
import { BarChart, ChartExport, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CHART_EXPORT_KEYS } from "#src/demos/free/chart-export/chart-export-keys.constant";

/** The demo's keys. */
const K = CHART_EXPORT_KEYS.chart_export;

/** Six months of sales. */
const MONTHS = [
  { month: "jan", sales: 42_000 },
  { month: "feb", sales: 38_500 },
  { month: "mar", sales: 51_200 },
  { month: "apr", sales: 47_800 },
  { month: "may", sales: 56_300 },
  { month: "jun", sales: 61_900 },
] as const;

/** Chart export: sales. */
export default function Sales() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ChartExport
      fileName="sales-riyadh"
      data={{
        head: [t(K.month), t(K.sales)],
        rows: MONTHS.map((row) => [t(K[row.month]), row.sales]),
      }}
    >
      <BarChart
        className="w-full"
        label={t(K.label)}
        data={MONTHS.map((row) => ({ name: t(K[row.month]), sales: row.sales }))}
        series={[{ key: "sales", label: t(K.sales) }]}
        xKey="name"
      />
    </ChartExport>
  );
}
