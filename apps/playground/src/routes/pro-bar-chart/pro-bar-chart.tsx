/**
 * Stackra file contract:
 * Purpose: the page of the BarChart route: `@stackra-pro/ui`'s BarChart as grouped columns (revenue by channel, with a
 *          legend that names each series) and as horizontal bars (top products), each with a named container and
 *          HeroUI Pro's own tooltip card on hover.
 * Boundary: presentation only; the figures are local. A chart's container is named by `label` with `role="img"`, and
 *          the legend is text beside the colour swatch, since the colour alone names nothing.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra-pro/ui/react";

import { DemoChartTick } from "#src/components/demo-chart-tick";
import { DemoChartTooltip } from "#src/components/demo-chart-tooltip";
import { ProBarChartRoute } from "#src/routes/pro-bar-chart/pro-bar-chart.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-bar-chart.*` keys.
const STRINGS = {
  documentTitle: `${ProBarChartRoute.title} · Stackra Playground`,
  intro:
    "Bars compare values. Columns can sit side by side for each period, or run horizontally when the names are long. Hover or focus a bar for its value.",
  grouped: "Revenue by channel",
  groupedLabel: "Bar chart of revenue by channel in dollars, January to June",
  horizontal: "Top products",
  horizontalLabel: "Horizontal bar chart of units sold by product this quarter",
  units: "Units",
} as const;

const REVENUE = [
  { month: "Jan", online: 4200, retail: 2800, direct: 3200 },
  { month: "Feb", online: 5800, retail: 3400, direct: 4100 },
  { month: "Mar", online: 4900, retail: 3100, direct: 3800 },
  { month: "Apr", online: 7200, retail: 4200, direct: 5200 },
  { month: "May", online: 6100, retail: 3800, direct: 4600 },
  { month: "Jun", online: 8400, retail: 4500, direct: 5800 },
];

const CHANNELS = [
  { key: "online", name: "Online", color: "var(--chart-3)" },
  { key: "retail", name: "Retail", color: "var(--chart-2)" },
  { key: "direct", name: "Direct", color: "var(--chart-1)" },
] as const;

const PRODUCTS = [
  { product: "Widgets", units: 1842 },
  { product: "Gadgets", units: 1567 },
  { product: "Modules", units: 1231 },
  { product: "Plugins", units: 985 },
  { product: "Add-ons", units: 743 },
];

// Compact, with one fraction digit only when a tick needs it (7.5K, 2K), and a plain 0 at zero.
const thousands = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
  .format;

/** The BarChart page. */
export function ProBarChart() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProBarChartRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="grouped-heading" className="grid max-w-3xl gap-3">
        <h2 id="grouped-heading" className="type-h2">
          {STRINGS.grouped}
        </h2>
        <ul className="flex flex-wrap gap-4 text-sm">
          {CHANNELS.map((channel) => (
            <li key={channel.key} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-3 rounded-full"
                style={{ backgroundColor: channel.color }}
              />
              <bdi>{channel.name}</bdi>
            </li>
          ))}
        </ul>
        <UiPro.BarChart data={REVENUE} height={240} label={STRINGS.groupedLabel} role="img">
          <UiPro.BarChart.Grid vertical={false} />
          <UiPro.BarChart.XAxis tick={<DemoChartTick />} dataKey="month" tickMargin={8} />
          <UiPro.BarChart.YAxis tick={<DemoChartTick />} tickFormatter={thousands} width={40} />
          {CHANNELS.map((channel) => (
            <UiPro.BarChart.Bar
              key={channel.key}
              barSize={12}
              dataKey={channel.key}
              fill={channel.color}
              name={channel.name}
              radius={[4, 4, 0, 0]}
            />
          ))}
          <UiPro.BarChart.Tooltip content={DemoChartTooltip} />
        </UiPro.BarChart>
      </section>
      <section aria-labelledby="horizontal-heading" className="grid max-w-xl gap-3">
        <h2 id="horizontal-heading" className="type-h2">
          {STRINGS.horizontal}
        </h2>
        <UiPro.BarChart
          data={PRODUCTS}
          height={220}
          label={STRINGS.horizontalLabel}
          layout="vertical"
          role="img"
        >
          <UiPro.BarChart.XAxis tick={<DemoChartTick />} tickMargin={4} type="number" />
          <UiPro.BarChart.YAxis
            tick={<DemoChartTick />}
            dataKey="product"
            tickMargin={4}
            type="category"
            width={64}
          />
          <UiPro.BarChart.Bar
            barSize={14}
            dataKey="units"
            fill="var(--chart-3)"
            name={STRINGS.units}
            radius={[0, 24, 24, 0]}
          />
          <UiPro.BarChart.Tooltip content={<UiPro.BarChart.TooltipContent />} />
        </UiPro.BarChart>
      </section>
    </article>
  );
}
