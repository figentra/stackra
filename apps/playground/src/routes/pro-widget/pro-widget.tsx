/**
 * Stackra file contract:
 * Purpose: the page of the Widget route: `@stackra/ui-pro`'s Widget as a dashboard container for a traffic breakdown,
 *          with a title, a description, a legend, a content area of labelled bars whose values are in text, and a
 *          footer, and as a plain widget holding only text.
 * Boundary: presentation only; the figures are local. The bars are drawn from chart tokens with the value beside each,
 *          since the playground draws no chart here and a bar's value must not rest on colour alone.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra/ui-pro/react";

import { ProWidgetRoute } from "#src/routes/pro-widget/pro-widget.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-widget.*` keys.
const STRINGS = {
  documentTitle: `${ProWidgetRoute.title} · Stackra Playground`,
  intro:
    "A dashboard container: a header with a title and legend, a content area on a raised surface, and an optional footer.",
  traffic: "With a legend",
  title: "Visits by source",
  description: "Last 30 days",
  footer: "Updated an hour ago",
  plain: "Plain",
  plainTitle: "Next review",
  plainText: "The quarterly design review is on the first Monday of next month.",
} as const;

const SOURCES = [
  { id: "direct", label: "Direct", visits: 4200, color: "var(--chart-1)" },
  { id: "search", label: "Search", visits: 3100, color: "var(--chart-2)" },
  { id: "social", label: "Social", visits: 1300, color: "var(--chart-3)" },
] as const;

const MAX = Math.max(...SOURCES.map((source) => source.visits));

/** The Widget page. */
export function ProWidget() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProWidgetRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="traffic-heading" className="grid gap-3">
        <h2 id="traffic-heading" className="type-h2">
          {STRINGS.traffic}
        </h2>
        <UiPro.Widget className="w-full max-w-lg">
          <UiPro.Widget.Header>
            <UiPro.Widget.Title>{STRINGS.title}</UiPro.Widget.Title>
            <UiPro.Widget.Description>{STRINGS.description}</UiPro.Widget.Description>
            <UiPro.Widget.Legend>
              {SOURCES.map((source) => (
                <UiPro.Widget.LegendItem key={source.id} color={source.color}>
                  {source.label}
                </UiPro.Widget.LegendItem>
              ))}
            </UiPro.Widget.Legend>
          </UiPro.Widget.Header>
          <UiPro.Widget.Content>
            <ul className="grid gap-3 p-4">
              {SOURCES.map((source) => (
                <li key={source.id} className="grid gap-1">
                  <div className="flex justify-between text-sm">
                    <span>{source.label}</span>
                    <span className="tabular-nums">{source.visits.toLocaleString("en-US")}</span>
                  </div>
                  <div
                    aria-hidden="true"
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.round((source.visits / MAX) * 100)}%`,
                      backgroundColor: source.color,
                    }}
                  />
                </li>
              ))}
            </ul>
          </UiPro.Widget.Content>
          <UiPro.Widget.Footer>
            <span className="text-sm text-muted">{STRINGS.footer}</span>
          </UiPro.Widget.Footer>
        </UiPro.Widget>
      </section>
      <section aria-labelledby="plain-heading" className="grid gap-3">
        <h2 id="plain-heading" className="type-h2">
          {STRINGS.plain}
        </h2>
        <UiPro.Widget className="w-full max-w-lg">
          <UiPro.Widget.Header>
            <UiPro.Widget.Title>{STRINGS.plainTitle}</UiPro.Widget.Title>
          </UiPro.Widget.Header>
          <UiPro.Widget.Content>
            <p className="p-4 text-sm">
              <bdi>{STRINGS.plainText}</bdi>
            </p>
          </UiPro.Widget.Content>
        </UiPro.Widget>
      </section>
    </article>
  );
}
