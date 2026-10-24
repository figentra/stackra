/**
 * Stackra file contract:
 * Purpose: the page of the Resizable route: `@stackra/ui-pro`'s Resizable as a side-by-side layout (a sidebar with
 *          pixel limits and a main panel) and as a stacked layout (an editor over a console), each separator named,
 *          draggable and moved with the arrow keys.
 * Boundary: presentation only. Each group sits in a fixed-height frame, since the panels fill the height they are given.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra/ui-pro/react";

import { ProResizableRoute } from "#src/routes/pro-resizable/pro-resizable.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-resizable.*` keys.
const STRINGS = {
  documentTitle: `${ProResizableRoute.title} · Stackra Playground`,
  intro:
    "Panels split by a draggable handle. Drag a handle, or focus it and use the arrow keys; Home and End move it to the limits.",
  columns: "Side by side",
  rows: "Stacked",
  resizeSidebar: "Resize the sidebar",
  resizeConsole: "Resize the console",
  sidebar: "Sidebar",
  main: "Main content",
  editor: "Editor",
  console: "Console",
} as const;

/** One panel's label, centred in its box. */
function Label({ children }: { readonly children: string }) {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <span className="text-sm font-medium">{children}</span>
    </div>
  );
}

/** The Resizable page. */
export function ProResizable() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProResizableRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="columns-heading" className="grid gap-3">
        <h2 id="columns-heading" className="type-h2">
          {STRINGS.columns}
        </h2>
        <div className="h-48 overflow-hidden rounded-xl border border-border bg-background">
          <UiPro.Resizable orientation="horizontal">
            <UiPro.Resizable.Panel
              defaultSize="180px"
              groupResizeBehavior="preserve-pixel-size"
              minSize="140px"
              maxSize="260px"
            >
              <Label>{STRINGS.sidebar}</Label>
            </UiPro.Resizable.Panel>
            <UiPro.Resizable.Handle label={STRINGS.resizeSidebar} />
            <UiPro.Resizable.Panel minSize={30}>
              <Label>{STRINGS.main}</Label>
            </UiPro.Resizable.Panel>
          </UiPro.Resizable>
        </div>
      </section>
      <section aria-labelledby="rows-heading" className="grid gap-3">
        <h2 id="rows-heading" className="type-h2">
          {STRINGS.rows}
        </h2>
        <div className="h-64 overflow-hidden rounded-xl border border-border bg-background">
          <UiPro.Resizable orientation="vertical">
            <UiPro.Resizable.Panel defaultSize={65} minSize={30}>
              <Label>{STRINGS.editor}</Label>
            </UiPro.Resizable.Panel>
            <UiPro.Resizable.Handle label={STRINGS.resizeConsole} />
            <UiPro.Resizable.Panel minSize={20}>
              <Label>{STRINGS.console}</Label>
            </UiPro.Resizable.Panel>
          </UiPro.Resizable>
        </div>
      </section>
    </article>
  );
}
