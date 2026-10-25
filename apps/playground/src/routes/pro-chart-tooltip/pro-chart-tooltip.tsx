/**
 * Stackra file contract:
 * Purpose: the page of the ChartTooltip route: `@stackra-pro/ui`'s ChartTooltip drawn as a card on its own (a header,
 *          two rows with their swatch, label and value) and as the card a bar chart shows for a pressed or hovered
 *          column.
 * Boundary: presentation only; the figures are local. The standalone card is plain content, so it sits in a named
 *          section; the chart's container is named by `label` with `role="img"`.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra-pro/ui/react";

import { DemoChartTick } from "#src/components/demo-chart-tick";
import { DemoChartTooltip } from "#src/components/demo-chart-tooltip";
import { ProChartTooltipRoute } from "#src/routes/pro-chart-tooltip/pro-chart-tooltip.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-chart-tooltip.*` keys.
const STRINGS = {
  documentTitle: `${ProChartTooltipRoute.title} · Stackra Playground`,
  intro:
    "The card a chart shows for a point: a header, then one row per series with its colour, name and value.",
  standalone: "On its own",
  header: "January",
  revenue: "Revenue",
  expenses: "Expenses",
  inChart: "Inside a chart",
  inChartLabel: "Bar chart of revenue and expenses in dollars, January to April",
} as const;

const DATA = [
  { month: "Jan", revenue: 12400, expenses: 8200 },
  { month: "Feb", revenue: 14100, expenses: 9000 },
  { month: "Mar", revenue: 13200, expenses: 8700 },
  { month: "Apr", revenue: 15800, expenses: 9400 },
];

const dollars = (value: number) => `$${value.toLocaleString("en-US")}`;

// Compact, with one fraction digit only when a tick needs it (7.5K, 2K), and a plain 0 at zero.
const thousands = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
  .format;

/** The ChartTooltip page. */
export function ProChartTooltip() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProChartTooltipRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="standalone-heading" className="grid gap-3">
        <h2 id="standalone-heading" className="type-h2">
          {STRINGS.standalone}
        </h2>
        <div>
          <UiPro.ChartTooltip>
            <UiPro.ChartTooltip.Header>{STRINGS.header}</UiPro.ChartTooltip.Header>
            <UiPro.ChartTooltip.Item>
              <UiPro.ChartTooltip.Indicator color="var(--chart-3)" />
              <UiPro.ChartTooltip.Label>{STRINGS.revenue}</UiPro.ChartTooltip.Label>
              <UiPro.ChartTooltip.Value>
                <bdi>{dollars(12400)}</bdi>
              </UiPro.ChartTooltip.Value>
            </UiPro.ChartTooltip.Item>
            <UiPro.ChartTooltip.Item>
              <UiPro.ChartTooltip.Indicator color="var(--chart-1)" />
              <UiPro.ChartTooltip.Label>{STRINGS.expenses}</UiPro.ChartTooltip.Label>
              <UiPro.ChartTooltip.Value>
                <bdi>{dollars(8200)}</bdi>
              </UiPro.ChartTooltip.Value>
            </UiPro.ChartTooltip.Item>
          </UiPro.ChartTooltip>
        </div>
      </section>
      <section aria-labelledby="chart-heading" className="grid max-w-3xl gap-3">
        <h2 id="chart-heading" className="type-h2">
          {STRINGS.inChart}
        </h2>
        <UiPro.BarChart data={DATA} height={220} label={STRINGS.inChartLabel} role="img">
          <UiPro.BarChart.Grid vertical={false} />
          <UiPro.BarChart.XAxis tick={<DemoChartTick />} dataKey="month" tickMargin={8} />
          <UiPro.BarChart.YAxis tick={<DemoChartTick />} tickFormatter={thousands} width={36} />
          <UiPro.BarChart.Bar
            barSize={14}
            dataKey="revenue"
            fill="var(--chart-3)"
            name={STRINGS.revenue}
            radius={[4, 4, 0, 0]}
          />
          <UiPro.BarChart.Bar
            barSize={14}
            dataKey="expenses"
            fill="var(--chart-1)"
            name={STRINGS.expenses}
            radius={[4, 4, 0, 0]}
          />
          <UiPro.BarChart.Tooltip
            content={(props) => <DemoChartTooltip {...props} format={dollars} />}
          />
        </UiPro.BarChart>
      </section>
    </article>
  );
}
