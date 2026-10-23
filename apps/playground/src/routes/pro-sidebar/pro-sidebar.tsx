/**
 * Stackra file contract:
 * Purpose: the page of the Sidebar route: `@stackra/ui-pro`'s Sidebar in a frame inside the page, collapsing to
 *          icons from its trigger, its rail or Ctrl or Cmd with B, with a working menu (an expandable item, a count, a
 *          footer) that reports the current item beside it.
 * Boundary: presentation and local state only. The sidebar sits in a fixed-height frame because HeroUI Pro sizes it to
 *          the viewport. The content column is a plain element, since HeroUI Pro's `Sidebar.Main` draws a second
 *          `main` landmark inside the shell's.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0304 (decision 6); ADR 0060 (light, dark, RTL); STA-403 FR-013.
 */
import * as UiPro from "@stackra/ui-pro/react";
import { useState } from "react";

import { DemoNavigation, navigationLabel } from "#src/components/demo-navigation";
import { ProSidebarRoute } from "#src/routes/pro-sidebar/pro-sidebar.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-sidebar.*` keys.
const STRINGS = {
  documentTitle: `${ProSidebarRoute.title} · Stackra Playground`,
  intro:
    "A sidebar that collapses to icons. Use the toggle in the content column, the rail on the sidebar's edge, or Ctrl or Cmd and B; choose an item to move the current page.",
  sidebar: "Primary navigation",
  toggle: "Collapse or expand the sidebar",
  current: (label: string) => `Current page: ${label}`,
  content: "Content",
} as const;

/** The Sidebar page. */
export function ProSidebar() {
  const [current, setCurrent] = useState("dashboard");

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProSidebarRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <div className="demo-frame">
        <UiPro.Sidebar.Provider collapsible="icon">
          <UiPro.Sidebar label={STRINGS.sidebar}>
            <DemoNavigation current={current} onNavigate={setCurrent} />
            <UiPro.Sidebar.Rail />
          </UiPro.Sidebar>
          <UiPro.Sidebar.Mobile>
            <DemoNavigation current={current} onNavigate={setCurrent} />
          </UiPro.Sidebar.Mobile>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-3 border-b border-border p-3">
              <UiPro.Sidebar.Trigger label={STRINGS.toggle} />
              <h2 className="type-h3">{STRINGS.content}</h2>
            </div>
            <p role="status" className="p-4">
              <bdi>{STRINGS.current(navigationLabel(current))}</bdi>
            </p>
          </div>
        </UiPro.Sidebar.Provider>
      </div>
    </article>
  );
}
