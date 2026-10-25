/**
 * Stackra file contract:
 * Purpose: the page of the AreaChart route: `@stackra-pro/ui`'s AreaChart as one filled series with a gradient (monthly
 *          revenue) and as stacked series (traffic by source), each with a named container, a legend that names its
 *          series and the shared ChartTooltip card on hover.
 * Boundary: presentation only; the figures are local. The chart's container is named by `label` with `role="img"`, and
 *          its legend is text beside the colour swatch, since the colour alone names nothing.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra-pro/ui/react";

import { DemoChartTick } from "#src/components/demo-chart-tick";
import { DemoChartTooltip } from "#src/components/demo-chart-tooltip";
import { ProAreaChartRoute } from "#src/routes/pro-area-chart/pro-area-chart.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-area-chart.*` keys.
const STRINGS = {
  documentTitle: `${ProAreaChartRoute.title} · Stackra Playground`,
  intro:
    "A trend over time as a filled line. One series carries a gradient; stacked series add up. Hover or focus a point for its values.",
  single: "Monthly revenue",
  singleLabel: "Area chart of monthly revenue in dollars, January to December",
  stacked: "Traffic by source",
  stackedLabel: "Stacked area chart of monthly visits by source, January to June",
  revenue: "Revenue",
} as const;

const REVENUE = [
  { month: "Jan", revenue: 4200 },
  { month: "Feb", revenue: 5800 },
  { month: "Mar", revenue: 4900 },
  { month: "Apr", revenue: 7200 },
  { month: "May", revenue: 6100 },
  { month: "Jun", revenue: 8400 },
  { month: "Jul", revenue: 7800 },
  { month: "Aug", revenue: 9200 },
  { month: "Sep", revenue: 8600 },
  { month: "Oct", revenue: 10200 },
  { month: "Nov", revenue: 9800 },
  { month: "Dec", revenue: 11500 },
];

const TRAFFIC = [
  { month: "Jan", organic: 2000, paid: 1000, referral: 500 },
  { month: "Feb", organic: 5000, paid: 3000, referral: 1200 },
  { month: "Mar", organic: 8000, paid: 5000, referral: 2100 },
  { month: "Apr", organic: 7000, paid: 6000, referral: 2800 },
  { month: "May", organic: 9500, paid: 4000, referral: 3200 },
  { month: "Jun", organic: 8000, paid: 5500, referral: 2600 },
];

const SERIES = [
  { key: "organic", name: "Organic", color: "var(--chart-4)" },
  { key: "paid", name: "Paid ads", color: "var(--chart-3)" },
  { key: "referral", name: "Referral", color: "var(--chart-2)" },
] as const;

// Compact, with one fraction digit only when a tick needs it (7.5K, 2K), and a plain 0 at zero.
const thousands = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
  .format;

/** The AreaChart page. */
export function ProAreaChart() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProAreaChartRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="single-heading" className="grid max-w-3xl gap-3">
        <h2 id="single-heading" className="type-h2">
          {STRINGS.single}
        </h2>
        <UiPro.AreaChart data={REVENUE} height={220} label={STRINGS.singleLabel} role="img">
          <defs>
            <linearGradient id="area-revenue-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <UiPro.AreaChart.Grid vertical={false} />
          <UiPro.AreaChart.XAxis dataKey="month" tick={<DemoChartTick />} tickMargin={8} />
          <UiPro.AreaChart.YAxis tick={<DemoChartTick />} tickFormatter={thousands} width={40} />
          <UiPro.AreaChart.Area
            dataKey="revenue"
            dot={false}
            fill="url(#area-revenue-fill)"
            name={STRINGS.revenue}
            stroke="var(--chart-3)"
            strokeWidth={2}
            type="monotone"
          />
          <UiPro.AreaChart.Tooltip content={DemoChartTooltip} />
        </UiPro.AreaChart>
      </section>
      <section aria-labelledby="stacked-heading" className="grid max-w-3xl gap-3">
        <h2 id="stacked-heading" className="type-h2">
          {STRINGS.stacked}
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
        <UiPro.AreaChart data={TRAFFIC} height={240} label={STRINGS.stackedLabel} role="img">
          <UiPro.AreaChart.Grid vertical={false} />
          <UiPro.AreaChart.XAxis dataKey="month" tick={<DemoChartTick />} tickMargin={8} />
          <UiPro.AreaChart.YAxis tick={<DemoChartTick />} tickFormatter={thousands} width={40} />
          {SERIES.map((series) => (
            <UiPro.AreaChart.Area
              key={series.key}
              dataKey={series.key}
              dot={false}
              fill={series.color}
              fillOpacity={0.25}
              name={series.name}
              stackId="traffic"
              stroke={series.color}
              strokeWidth={2}
              type="monotone"
            />
          ))}
          <UiPro.AreaChart.Tooltip content={DemoChartTooltip} />
        </UiPro.AreaChart>
      </section>
    </article>
  );
}
