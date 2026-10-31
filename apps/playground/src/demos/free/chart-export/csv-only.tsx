/**
 * Stackra file contract:
 * Purpose: the "csv-only" demo of the web ChartExport: the numbers only: a CSV of the raw figures, ready for a spreadsheet.
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

/** Chart export: csv only. */
export default function CsvOnly() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ChartExport
      fileName="sales-riyadh"
      formats={["csv"]}
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
