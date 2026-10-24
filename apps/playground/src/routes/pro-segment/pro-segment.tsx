/**
 * Stackra file contract:
 * Purpose: the page of the Segment route: `@stackra/ui-pro`'s Segment as a view switch (four labelled choices with the
 *          selection reported beside it) and as a small ghost range picker with separators.
 * Boundary: presentation and local state only.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra/ui-pro/react";
import { useState } from "react";

import { ProSegmentRoute } from "#src/routes/pro-segment/pro-segment.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-segment.*` keys.
const STRINGS = {
  documentTitle: `${ProSegmentRoute.title} · Stackra Playground`,
  intro:
    "A segmented control for choosing one of a few options. Move with the arrow keys and press Space or Enter, or press a segment.",
  view: "View",
  views: "Dashboard views",
  range: "Time range",
  ranges: "Chart range",
  selected: (label: string) => `Selected: ${label}`,
} as const;

const VIEWS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "analytics", label: "Analytics" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
] as const;

const RANGES = [
  { id: "1w", label: "1W" },
  { id: "4w", label: "4W" },
  { id: "1y", label: "1Y" },
  { id: "all", label: "All" },
] as const;

// axe cannot work out the colour behind a selected label while HeroUI Pro's sliding indicator sits under it, so the
// page hides the indicator and paints the selected item itself: the same colours, without the slide.
const NO_INDICATOR = "[&_[data-slot=segment-indicator]]:hidden";
const SELECTED = "data-[selected=true]:bg-(--segment)";
const SELECTED_GHOST = "data-[selected=true]:bg-accent";

/** The Segment page. */
export function ProSegment() {
  const [view, setView] = useState<string>("dashboard");
  const [range, setRange] = useState<string>("4w");

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProSegmentRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="view-heading" className="grid gap-3">
        <h2 id="view-heading" className="type-h2">
          {STRINGS.view}
        </h2>
        <div>
          <UiPro.Segment
            label={STRINGS.views}
            className={NO_INDICATOR}
            selectedKey={view}
            onSelectionChange={(key) => setView(String(key))}
          >
            {VIEWS.map((item) => (
              <UiPro.Segment.Item key={item.id} id={item.id} className={SELECTED}>
                {item.label}
              </UiPro.Segment.Item>
            ))}
          </UiPro.Segment>
        </div>
        <p role="status">
          <bdi>{STRINGS.selected(VIEWS.find((item) => item.id === view)?.label ?? "")}</bdi>
        </p>
      </section>
      <section aria-labelledby="range-heading" className="grid gap-3">
        <h2 id="range-heading" className="type-h2">
          {STRINGS.range}
        </h2>
        <div>
          <UiPro.Segment
            label={STRINGS.ranges}
            className={NO_INDICATOR}
            size="sm"
            variant="ghost"
            selectedKey={range}
            onSelectionChange={(key) => setRange(String(key))}
          >
            {RANGES.map((item) => (
              <UiPro.Segment.Item key={item.id} id={item.id} className={SELECTED_GHOST}>
                <UiPro.Segment.Separator />
                {item.label}
              </UiPro.Segment.Item>
            ))}
          </UiPro.Segment>
        </div>
      </section>
    </article>
  );
}
