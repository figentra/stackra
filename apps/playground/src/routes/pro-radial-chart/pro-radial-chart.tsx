/**
 * Stackra file contract:
 * Purpose: the page of the RadialChart route: `@stackra/ui-pro`'s RadialChart as rings (three activity goals, each
 *          named with its figure beside the chart) and as a gauge (active users against a total, the figure in the
 *          middle), each with a named container and HeroUI Pro's own tooltip card on hover.
 * Boundary: presentation only; the figures are local. A chart's container is named by `label` with `role="img"`, and
 *          the figures are text beside it, since the arc alone gives no value.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra/ui-pro/react";

import { ProRadialChartRoute } from "#src/routes/pro-radial-chart/pro-radial-chart.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-radial-chart.*` keys.
const STRINGS = {
  documentTitle: `${ProRadialChartRoute.title} · Stackra Playground`,
  intro:
    "Arcs show progress toward a goal: several rings side by side, or one gauge with its figure in the middle. The figures are written beside the chart.",
  rings: "Daily activity",
  ringsLabel: "Radial chart of three daily goals: calories, steps and exercise",
  gauge: "Active users",
  gaugeLabel: "Gauge of 780 active users out of 1,358",
  users: "Active users",
  of: "of",
} as const;

const ACTIVITY = [
  { fill: "var(--chart-4)", name: "Calories", value: 200, valueText: "1,623 of 2,000 kcal" },
  { fill: "var(--chart-3)", name: "Steps", value: 350, valueText: "8,328 of 10,000 steps" },
  { fill: "var(--chart-2)", name: "Exercise", value: 250, valueText: "25 of 120 min" },
];

const TOTAL = 1358;
const CURRENT = 780;
const GAUGE = [{ fill: "var(--chart-3)", name: STRINGS.users, value: CURRENT }];

/** The RadialChart page. */
export function ProRadialChart() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProRadialChartRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="rings-heading" className="grid max-w-md gap-3">
          <h2 id="rings-heading" className="type-h2">
            {STRINGS.rings}
          </h2>
          <div className="flex items-center gap-4">
            <dl className="grid flex-1 gap-2">
              {ACTIVITY.map((item) => (
                <div key={item.name}>
                  <dt className="flex items-center gap-2 text-xs text-muted">
                    <span
                      aria-hidden="true"
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    {item.name}
                  </dt>
                  <dd className="text-sm font-semibold">
                    <bdi>{item.valueText}</bdi>
                  </dd>
                </div>
              ))}
            </dl>
            <UiPro.RadialChart
              data={ACTIVITY}
              height={200}
              innerRadius="40%"
              label={STRINGS.ringsLabel}
              outerRadius="100%"
              role="img"
              width={200}
            >
              <UiPro.RadialChart.Bar background cornerRadius={12} dataKey="value" />
              <UiPro.RadialChart.Tooltip content={<UiPro.RadialChart.TooltipContent />} />
            </UiPro.RadialChart>
          </div>
        </section>
        <section aria-labelledby="gauge-heading" className="grid max-w-xs gap-3">
          <h2 id="gauge-heading" className="type-h2">
            {STRINGS.gauge}
          </h2>
          <div className="relative w-fit">
            <UiPro.RadialChart
              barSize={10}
              data={GAUGE}
              endAngle={-45}
              height={200}
              innerRadius="70%"
              label={STRINGS.gaugeLabel}
              outerRadius="90%"
              role="img"
              startAngle={225}
              width={200}
            >
              <UiPro.RadialChart.AngleAxis
                angleAxisId={0}
                domain={[0, TOTAL]}
                tick={false}
                type="number"
              />
              <UiPro.RadialChart.Bar background angleAxisId={0} cornerRadius={12} dataKey="value" />
              <UiPro.RadialChart.Tooltip content={<UiPro.RadialChart.TooltipContent />} />
            </UiPro.RadialChart>
            {/* The disc is roomy enough that its three lines never reach past its edge, whatever the font. */}
            <div className="pointer-events-none absolute inset-[25%] flex flex-col items-center justify-center rounded-full bg-background whitespace-nowrap">
              <span className="text-xs text-muted">{STRINGS.users}</span>
              <span className="text-xl font-bold">
                <bdi>{CURRENT.toLocaleString("en-US")}</bdi>
              </span>
              <span className="text-xs text-muted">
                <bdi>
                  {STRINGS.of} {TOTAL.toLocaleString("en-US")}
                </bdi>
              </span>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}
