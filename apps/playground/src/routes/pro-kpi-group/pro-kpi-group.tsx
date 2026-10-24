/**
 * Stackra file contract:
 * Purpose: the page of the KpiGroup route: `@stackra/ui-pro`'s KpiGroup joining three Kpi cards into one horizontal
 *          strip with separators, and stacking two in a vertical group, each with a formatted value and a trend that
 *          names its direction.
 * Boundary: presentation only; the figures are local.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra/ui-pro/react";
import { Fragment } from "react";

import { ProKpiGroupRoute } from "#src/routes/pro-kpi-group/pro-kpi-group.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-kpi-group.*` keys.
const STRINGS = {
  documentTitle: `${ProKpiGroupRoute.title} · Stackra Playground`,
  intro:
    "Several Kpi cards arranged as one group, side by side or stacked, with a separator between each.",
  horizontal: "Horizontal",
  vertical: "Vertical",
  direction: { up: "Trending up", down: "Trending down" },
} as const;

/** One card of a group. */
interface Metric {
  readonly id: string;
  readonly title: string;
  readonly value: number;
  readonly format: "decimal" | "percent";
  readonly trend: keyof typeof STRINGS.direction;
  readonly change: string;
}

const METRICS: readonly Metric[] = [
  {
    id: "subscribers",
    title: "Total subscribers",
    value: 71897,
    format: "decimal",
    trend: "up",
    change: "+12%",
  },
  {
    id: "open",
    title: "Average open rate",
    value: 0.5816,
    format: "percent",
    trend: "up",
    change: "+2.02%",
  },
  {
    id: "click",
    title: "Average click rate",
    value: 0.2457,
    format: "percent",
    trend: "down",
    change: "-4.05%",
  },
];

/** One Kpi card for a metric. */
function MetricCard({ metric }: { readonly metric: Metric }) {
  return (
    <UiPro.Kpi>
      <UiPro.Kpi.Header>
        <UiPro.Kpi.Title>{metric.title}</UiPro.Kpi.Title>
      </UiPro.Kpi.Header>
      <UiPro.Kpi.Content>
        <UiPro.Kpi.Value
          value={metric.value}
          style={metric.format}
          maximumFractionDigits={metric.format === "percent" ? 1 : 0}
        />
        <UiPro.Kpi.Trend trend={metric.trend}>
          {metric.change}
          <UiPro.TrendChip.Suffix>
            <span className="sr-only">{STRINGS.direction[metric.trend]}</span>
          </UiPro.TrendChip.Suffix>
        </UiPro.Kpi.Trend>
      </UiPro.Kpi.Content>
    </UiPro.Kpi>
  );
}

/** The KpiGroup page. */
export function ProKpiGroup() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProKpiGroupRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="horizontal-heading" className="grid gap-3">
        <h2 id="horizontal-heading" className="type-h2">
          {STRINGS.horizontal}
        </h2>
        <UiPro.KpiGroup>
          {METRICS.map((metric, index) => (
            <Fragment key={metric.id}>
              {index > 0 ? <UiPro.KpiGroup.Separator /> : null}
              <MetricCard metric={metric} />
            </Fragment>
          ))}
        </UiPro.KpiGroup>
      </section>
      <section aria-labelledby="vertical-heading" className="grid max-w-sm gap-3">
        <h2 id="vertical-heading" className="type-h2">
          {STRINGS.vertical}
        </h2>
        <UiPro.KpiGroup orientation="vertical">
          {METRICS.slice(0, 2).map((metric, index) => (
            <Fragment key={metric.id}>
              {index > 0 ? <UiPro.KpiGroup.Separator /> : null}
              <MetricCard metric={metric} />
            </Fragment>
          ))}
        </UiPro.KpiGroup>
      </section>
    </article>
  );
}
