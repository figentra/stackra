/**
 * Stackra file contract:
 * Purpose: the page of the LineChart route: `@stackra/ui-pro`'s LineChart with two series (traffic by source, a legend
 *          that names each series) and with one dashed series against a solid one (this year against last), each with a
 *          named container and the shared ChartTooltip card on hover.
 * Boundary: presentation only; the figures are local. A chart's container is named by `label` with `role="img"`, and
 *          the legend is text beside the colour swatch, since colour alone names nothing; the dashed line also differs
 *          from the solid one in its shape, not only its colour.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra/ui-pro/react";

import { DemoChartTick } from "#src/components/demo-chart-tick";
import { DemoChartTooltip } from "#src/components/demo-chart-tooltip";
import { ProLineChartRoute } from "#src/routes/pro-line-chart/pro-line-chart.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-line-chart.*` keys.
const STRINGS = {
  documentTitle: `${ProLineChartRoute.title} · Stackra Playground`,
  intro:
    "Lines follow values over time. Several series share one scale; a dashed line marks the comparison. Hover or focus a point for its values.",
  traffic: "Traffic by source",
  trafficLabel: "Line chart of monthly sessions by source, January to December",
  comparison: "This year against last year",
  comparisonLabel:
    "Line chart of monthly orders, this year as a solid line and last year as a dashed line",
} as const;

const TRAFFIC = [
  { month: "Jan", organic: 2000, paid: 1000 },
  { month: "Feb", organic: 15000, paid: 10000 },
  { month: "Mar", organic: 8000, paid: 12000 },
  { month: "Apr", organic: 14000, paid: 14000 },
  { month: "May", organic: 15000, paid: 8000 },
  { month: "Jun", organic: 8000, paid: 9000 },
  { month: "Jul", organic: 18000, paid: 12000 },
  { month: "Aug", organic: 18000, paid: 10000 },
  { month: "Sep", organic: 20000, paid: 5000 },
  { month: "Oct", organic: 17000, paid: 12000 },
  { month: "Nov", organic: 22000, paid: 18000 },
  { month: "Dec", organic: 15000, paid: 9000 },
];

const ORDERS = [
  { month: "Jan", thisYear: 320, lastYear: 280 },
  { month: "Feb", thisYear: 450, lastYear: 340 },
  { month: "Mar", thisYear: 380, lastYear: 360 },
  { month: "Apr", thisYear: 520, lastYear: 410 },
  { month: "May", thisYear: 480, lastYear: 450 },
  { month: "Jun", thisYear: 600, lastYear: 430 },
];

const SERIES = [
  { key: "organic", name: "Organic", color: "var(--chart-3)" },
  { key: "paid", name: "Paid ads", color: "var(--chart-1)" },
] as const;

// Compact, with one fraction digit only when a tick needs it (7.5K, 2K), and a plain 0 at zero.
const thousands = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
  .format;

/** The LineChart page. */
export function ProLineChart() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProLineChartRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="traffic-heading" className="grid max-w-3xl gap-3">
        <h2 id="traffic-heading" className="type-h2">
          {STRINGS.traffic}
        </h2>
        <ul className="flex flex-wrap gap-4 text-sm">
          {SERIES.map((series) => (
            <li key={series.key} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-3 rounded-full"
                style={{ backgroundColor: series.color }}
              />
              <bdi>{series.name}</bdi>
            </li>
          ))}
        </ul>
        <UiPro.LineChart data={TRAFFIC} height={220} label={STRINGS.trafficLabel} role="img">
          <UiPro.LineChart.Grid vertical={false} />
          <UiPro.LineChart.XAxis tick={<DemoChartTick />} dataKey="month" tickMargin={8} />
          <UiPro.LineChart.YAxis tick={<DemoChartTick />} tickFormatter={thousands} width={36} />
          {SERIES.map((series) => (
            <UiPro.LineChart.Line
              key={series.key}
              dataKey={series.key}
              dot={false}
              name={series.name}
              stroke={series.color}
              strokeWidth={2}
              type="linear"
            />
          ))}
          <UiPro.LineChart.Tooltip content={DemoChartTooltip} />
        </UiPro.LineChart>
      </section>
      <section aria-labelledby="comparison-heading" className="grid max-w-3xl gap-3">
        <h2 id="comparison-heading" className="type-h2">
          {STRINGS.comparison}
        </h2>
        <UiPro.LineChart data={ORDERS} height={220} label={STRINGS.comparisonLabel} role="img">
          <UiPro.LineChart.Grid vertical={false} />
          <UiPro.LineChart.XAxis tick={<DemoChartTick />} dataKey="month" tickMargin={8} />
          <UiPro.LineChart.YAxis tick={<DemoChartTick />} width={36} />
          <UiPro.LineChart.Line
            dataKey="thisYear"
            dot={{ r: 3 }}
            name="This year"
            stroke="var(--chart-3)"
            strokeWidth={2}
            type="monotone"
          />
          <UiPro.LineChart.Line
            dataKey="lastYear"
            dot={false}
            name="Last year"
            stroke="var(--chart-1)"
            strokeDasharray="4 4"
            strokeWidth={2}
            type="monotone"
          />
          <UiPro.LineChart.Tooltip content={DemoChartTooltip} />
        </UiPro.LineChart>
      </section>
    </article>
  );
}
