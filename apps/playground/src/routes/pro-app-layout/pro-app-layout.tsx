/**
 * Stackra file contract:
 * Purpose: the page of the AppLayout route: `@stackra/ui-pro`'s AppLayout in a frame inside the page, with the sidebar
 *          (collapsing to icons), a top bar with the menu toggle that opens the navigation on a narrow viewport and the
 *          trigger of the aside panel, the main content, and the aside.
 * Boundary: presentation and local state only. The layout sits in a fixed-height frame because HeroUI Pro sizes it to the
 *          viewport. It draws the page's only `main` landmark, so the shell adds none for this route (`ownsMain`), and
 *          the page keeps its h1 outside the frame, in a plain `header`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0304 (decision 6); ADR 0060 (light, dark, RTL); STA-403 FR-013.
 */
import * as UiPro from "@stackra/ui-pro/react";
import { useState } from "react";

import { DemoNavigation, navigationLabel } from "#src/components/demo-navigation";
import { ProAppLayoutRoute } from "#src/routes/pro-app-layout/pro-app-layout.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-app-layout.*` keys.
const STRINGS = {
  documentTitle: `${ProAppLayoutRoute.title} · Stackra Playground`,
  intro:
    "An application shell: a sidebar, a top bar, the main content and an aside panel. The aside opens and closes from its trigger in the top bar; on a narrow viewport the menu button opens the navigation.",
  sidebar: "Primary navigation",
  menu: "Open navigation",
  toggle: "Collapse or expand the sidebar",
  aside: "Show or hide the details panel",
  overview: "Overview",
  current: (label: string) => `Current page: ${label}`,
  details: "Details",
  detailsText: "The aside holds context for the page: properties, history or help.",
} as const;

/** The AppLayout page. */
export function ProAppLayout() {
  const [current, setCurrent] = useState("dashboard");

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProAppLayoutRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <div className="demo-frame">
        <UiPro.AppLayout
          scrollMode="content"
          sidebar={
            <>
              <UiPro.Sidebar label={STRINGS.sidebar}>
                <DemoNavigation current={current} onNavigate={setCurrent} />
                <UiPro.Sidebar.Rail />
              </UiPro.Sidebar>
              <UiPro.Sidebar.Mobile>
                <DemoNavigation current={current} onNavigate={setCurrent} />
              </UiPro.Sidebar.Mobile>
            </>
          }
          navbar={
            <div className="flex items-center gap-2 border-b border-border bg-background px-4 py-2">
              <UiPro.AppLayout.MenuToggle label={STRINGS.menu} />
              <UiPro.Sidebar.Trigger label={STRINGS.toggle} />
              <span className="flex-1 truncate font-semibold">
                <bdi>{navigationLabel(current)}</bdi>
              </span>
              <UiPro.AppLayout.AsideTrigger label={STRINGS.aside} />
            </div>
          }
          aside={
            <div className="grid content-start gap-2 p-4">
              <h2 className="type-h3">{STRINGS.details}</h2>
              <p className="text-muted">
                <bdi>{STRINGS.detailsText}</bdi>
              </p>
            </div>
          }
        >
          <div className="grid content-start gap-3 p-6">
            <h2 className="type-h2">{STRINGS.overview}</h2>
            <p role="status">
              <bdi>{STRINGS.current(navigationLabel(current))}</bdi>
            </p>
          </div>
        </UiPro.AppLayout>
      </div>
    </article>
  );
}
