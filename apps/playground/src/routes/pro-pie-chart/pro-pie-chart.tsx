/**
 * Stackra file contract:
 * Purpose: the page of the PieChart route: `@stackra/ui-pro`'s PieChart as a whole pie (browser usage) and as a donut
 *          (traffic sources), each with a named container and a legend that names each slice with its value, and HeroUI
 *          Pro's own tooltip card on hover.
 * Boundary: presentation only; the figures are local. A chart's container is named by `label` with `role="img"`, and
 *          the legend is text with the value beside the colour swatch, since colour alone names nothing.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra/ui-pro/react";

import { ProPieChartRoute } from "#src/routes/pro-pie-chart/pro-pie-chart.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-pie-chart.*` keys.
const STRINGS = {
  documentTitle: `${ProPieChartRoute.title} · Stackra Playground`,
  intro:
    "Slices show parts of a whole. A donut leaves room in the middle. The legend names each slice with its value. Hover or focus a slice for its value.",
  pie: "Browser usage",
  pieLabel: "Pie chart of browser usage in percent: Chrome, Safari, Firefox and Edge",
  donut: "Traffic sources",
  donutLabel: "Donut chart of visits by source: Organic, Direct, Referral and Social",
} as const;

const COLORS = ["var(--chart-4)", "var(--chart-3)", "var(--chart-2)", "var(--chart-1)"];

const BROWSERS = [
  { name: "Chrome", value: 62 },
  { name: "Safari", value: 19 },
  { name: "Firefox", value: 10 },
  { name: "Edge", value: 9 },
];

const SOURCES = [
  { name: "Organic", value: 4500 },
  { name: "Direct", value: 3200 },
  { name: "Referral", value: 2100 },
  { name: "Social", value: 1400 },
];

/** The legend of a chart: a swatch, the name and the value of each slice. */
function Legend({
  slices,
  suffix = "",
}: {
  slices: readonly { name: string; value: number }[];
  suffix?: string;
}) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
      {slices.map((slice, index) => (
        <li key={slice.name} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-3 rounded-full"
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
          />
          <bdi>
            {slice.name} ({slice.value.toLocaleString("en-US")}
            {suffix})
          </bdi>
        </li>
      ))}
    </ul>
  );
}

/** The PieChart page. */
export function ProPieChart() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProPieChartRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="pie-heading" className="grid max-w-sm gap-3">
          <h2 id="pie-heading" className="type-h2">
            {STRINGS.pie}
          </h2>
          <UiPro.PieChart height={220} label={STRINGS.pieLabel} role="img">
            <UiPro.PieChart.Pie
              cx="50%"
              cy="50%"
              data={BROWSERS}
              dataKey="value"
              nameKey="name"
              outerRadius={90}
            >
              {BROWSERS.map((slice, index) => (
                <UiPro.PieChart.Cell key={slice.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </UiPro.PieChart.Pie>
            <UiPro.PieChart.Tooltip content={<UiPro.PieChart.TooltipContent />} />
          </UiPro.PieChart>
          <Legend slices={BROWSERS} suffix="%" />
        </section>
        <section aria-labelledby="donut-heading" className="grid max-w-sm gap-3">
          <h2 id="donut-heading" className="type-h2">
            {STRINGS.donut}
          </h2>
          <UiPro.PieChart height={220} label={STRINGS.donutLabel} role="img">
            <UiPro.PieChart.Pie
              cornerRadius={12}
              cx="50%"
              cy="50%"
              data={SOURCES}
              dataKey="value"
              innerRadius="68%"
              nameKey="name"
              paddingAngle={-20}
              strokeWidth={0}
            >
              {SOURCES.map((slice, index) => (
                <UiPro.PieChart.Cell key={slice.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </UiPro.PieChart.Pie>
            <UiPro.PieChart.Tooltip content={<UiPro.PieChart.TooltipContent />} />
          </UiPro.PieChart>
          <Legend slices={SOURCES} />
        </section>
      </div>
    </article>
  );
}
