/**
 * Stackra file contract:
 * Purpose: the page of the Kpi route: four `@stackra/ui-pro` Kpi cards (revenue, users, refund rate, storage) with a
 *          formatted value, a trend that names its direction, a tinted icon, a progress bar on one, an actions button
 *          and a footer note.
 * Boundary: presentation only; the figures are local.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0310 (decision 6); ADR 0060 (light, dark, RTL); STA-403 FR-013.
 */
import * as UiPro from "@stackra/ui-pro/react";

import { DemoIcon, type DemoIconName } from "#src/components/demo-icon";
import { ProKpiRoute } from "#src/routes/pro-kpi/pro-kpi.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-kpi.*` keys.
const STRINGS = {
  documentTitle: `${ProKpiRoute.title} · Stackra Playground`,
  intro:
    "Metric cards: a value, its change with the direction named, an icon tinted by tone, and a progress bar where the metric has a limit.",
  metrics: "Key metrics",
  actions: (title: string) => `Actions for ${title}`,
  direction: { up: "Trending up", down: "Trending down", neutral: "No change" },
} as const;

/** One metric card. */
interface Metric {
  readonly id: string;
  readonly title: string;
  readonly icon: DemoIconName;
  readonly tone: UiPro.KpiIconProps["tone"];
  readonly value: number;
  readonly format: "currency" | "decimal" | "percent";
  readonly trend: keyof typeof STRINGS.direction;
  readonly change: string;
  readonly note: string;
  readonly progress?: number;
}

const METRICS: readonly Metric[] = [
  {
    id: "revenue",
    title: "Revenue",
    icon: "money",
    tone: "success",
    value: 128450,
    format: "currency",
    trend: "up",
    change: "+8.2%",
    note: "Compared with last month",
  },
  {
    id: "users",
    title: "Active users",
    icon: "users",
    tone: "success",
    value: 3482,
    format: "decimal",
    trend: "up",
    change: "+1.4%",
    note: "Compared with last month",
  },
  {
    id: "refunds",
    title: "Refund rate",
    icon: "doc",
    tone: "danger",
    value: 0.021,
    format: "percent",
    trend: "down",
    change: "-0.4%",
    note: "Lower is better",
  },
  {
    id: "storage",
    title: "Storage used",
    icon: "chart",
    tone: "warning",
    value: 0.72,
    format: "percent",
    trend: "neutral",
    change: "0.0%",
    note: "Of the 500 GB plan",
    progress: 72,
  },
];

/** The Kpi page. */
export function ProKpi() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProKpiRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="metrics-heading" className="grid gap-3">
        <h2 id="metrics-heading" className="type-h2">
          {STRINGS.metrics}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {METRICS.map((metric) => (
            <UiPro.Kpi key={metric.id}>
              <UiPro.Kpi.Header>
                <UiPro.Kpi.Icon tone={metric.tone}>
                  <DemoIcon name={metric.icon} />
                </UiPro.Kpi.Icon>
                <UiPro.Kpi.Title>{metric.title}</UiPro.Kpi.Title>
              </UiPro.Kpi.Header>
              <UiPro.Kpi.Content>
                <UiPro.Kpi.Value
                  value={metric.value}
                  style={metric.format}
                  {...(metric.format === "currency"
                    ? { currency: "USD", maximumFractionDigits: 0 }
                    : metric.format === "percent"
                      ? { maximumFractionDigits: 1 }
                      : {})}
                />
                <UiPro.Kpi.Trend trend={metric.trend}>
                  {metric.change}
                  <UiPro.TrendChip.Suffix>
                    <span className="sr-only">{STRINGS.direction[metric.trend]}</span>
                  </UiPro.TrendChip.Suffix>
                </UiPro.Kpi.Trend>
                {metric.progress === undefined ? null : (
                  <UiPro.Kpi.Progress tone="warning" value={metric.progress} />
                )}
              </UiPro.Kpi.Content>
              <UiPro.Kpi.Actions label={STRINGS.actions(metric.title)} />
              <UiPro.Kpi.Footer>
                <span className="text-sm text-muted">
                  <bdi>{metric.note}</bdi>
                </span>
              </UiPro.Kpi.Footer>
            </UiPro.Kpi>
          ))}
        </div>
      </section>
    </article>
  );
}
