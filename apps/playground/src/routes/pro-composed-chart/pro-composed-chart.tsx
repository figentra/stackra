/**
 * Stackra file contract:
 * Purpose: the page of the ComposedChart route: `@stackra-pro/ui`'s ComposedChart with columns and a line on two
 *          scales (revenue and orders), and with an area under a line (visits and sign-ups), each with a named
 *          container, a legend that names each series and the shared ChartTooltip card on hover.
 * Boundary: presentation only; the figures are local. A chart's container is named by `label` with `role="img"`, and
 *          the legend is text beside the colour swatch, since colour alone names nothing.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra-pro/ui/react";

import { DemoChartTick } from "#src/components/demo-chart-tick";
import { DemoChartTooltip } from "#src/components/demo-chart-tooltip";
import { ProComposedChartRoute } from "#src/routes/pro-composed-chart/pro-composed-chart.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-composed-chart.*` keys.
const STRINGS = {
  documentTitle: `${ProComposedChartRoute.title} · Stackra Playground`,
  intro:
    "Several kinds of series in one chart: columns, lines and areas, on one scale or on two. Hover or focus a point for its values.",
  orders: "Revenue and orders",
  ordersLabel:
    "Chart of monthly revenue in dollars as columns on the left scale and orders as a line on the right scale",
  visits: "Visits and sign-ups",
  visitsLabel: "Chart of weekly visits as an area and sign-ups as a line",
} as const;

const SALES = [
  { month: "Jan", orders: 320, revenue: 4200 },
  { month: "Feb", orders: 450, revenue: 5800 },
  { month: "Mar", orders: 380, revenue: 4900 },
  { month: "Apr", orders: 520, revenue: 7200 },
  { month: "May", orders: 480, revenue: 6100 },
  { month: "Jun", orders: 600, revenue: 8400 },
];

const WEEKS = [
  { week: "W1", visits: 1200, signups: 90 },
  { week: "W2", visits: 1800, signups: 130 },
  { week: "W3", visits: 1500, signups: 110 },
  { week: "W4", visits: 2400, signups: 190 },
  { week: "W5", visits: 2100, signups: 170 },
  { week: "W6", visits: 2900, signups: 240 },
];

const SALES_SERIES = [
  { name: "Revenue", color: "var(--chart-3)" },
  { name: "Orders", color: "var(--chart-1)" },
] as const;

const VISITS_SERIES = [
  { name: "Visits", color: "var(--chart-4)" },
  { name: "Sign-ups", color: "var(--chart-1)" },
] as const;

// Compact, with one fraction digit only when a tick needs it (7.5K, 2K), and a plain 0 at zero.
const thousands = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
  .format;

/** The legend of a chart: a swatch and the name of each series. */
function Legend({ series }: { series: readonly { name: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-4 text-sm">
      {series.map((item) => (
        <li key={item.name} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <bdi>{item.name}</bdi>
        </li>
      ))}
    </ul>
  );
}

/** The ComposedChart page. */
export function ProComposedChart() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProComposedChartRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="orders-heading" className="grid max-w-3xl gap-3">
        <h2 id="orders-heading" className="type-h2">
          {STRINGS.orders}
        </h2>
        <Legend series={SALES_SERIES} />
        <UiPro.ComposedChart data={SALES} height={240} label={STRINGS.ordersLabel} role="img">
          <UiPro.ComposedChart.Grid vertical={false} />
          <UiPro.ComposedChart.XAxis tick={<DemoChartTick />} dataKey="month" tickMargin={8} />
          <UiPro.ComposedChart.YAxis
            tick={<DemoChartTick />}
            tickFormatter={thousands}
            width={40}
            yAxisId="left"
          />
          <UiPro.ComposedChart.YAxis
            tick={<DemoChartTick />}
            orientation="right"
            width={40}
            yAxisId="right"
          />
          <UiPro.ComposedChart.Bar
            barSize={16}
            dataKey="revenue"
            fill="var(--chart-3)"
            name="Revenue"
            radius={[4, 4, 0, 0]}
            yAxisId="left"
          />
          <UiPro.ComposedChart.Line
            dataKey="orders"
            dot={false}
            name="Orders"
            stroke="var(--chart-1)"
            strokeWidth={2}
            type="monotone"
            yAxisId="right"
          />
          <UiPro.ComposedChart.Tooltip content={DemoChartTooltip} />
        </UiPro.ComposedChart>
      </section>
      <section aria-labelledby="visits-heading" className="grid max-w-3xl gap-3">
        <h2 id="visits-heading" className="type-h2">
          {STRINGS.visits}
        </h2>
        <Legend series={VISITS_SERIES} />
        <UiPro.ComposedChart data={WEEKS} height={240} label={STRINGS.visitsLabel} role="img">
          <UiPro.ComposedChart.Grid vertical={false} />
          <UiPro.ComposedChart.XAxis tick={<DemoChartTick />} dataKey="week" tickMargin={8} />
          <UiPro.ComposedChart.YAxis
            tick={<DemoChartTick />}
            tickFormatter={thousands}
            width={40}
            yAxisId="left"
          />
          <UiPro.ComposedChart.YAxis
            tick={<DemoChartTick />}
            orientation="right"
            width={40}
            yAxisId="right"
          />
          <UiPro.ComposedChart.Area
            dataKey="visits"
            fill="var(--chart-4)"
            fillOpacity={0.2}
            name="Visits"
            stroke="var(--chart-4)"
            strokeWidth={2}
            type="monotone"
            yAxisId="left"
          />
          <UiPro.ComposedChart.Line
            dataKey="signups"
            dot={false}
            name="Sign-ups"
            stroke="var(--chart-1)"
            strokeWidth={2}
            type="monotone"
            yAxisId="right"
          />
          <UiPro.ComposedChart.Tooltip content={DemoChartTooltip} />
        </UiPro.ComposedChart>
      </section>
    </article>
  );
}
