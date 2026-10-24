/**
 * Stackra file contract:
 * Purpose: the page of the FloatingTableOfContents route: `@stackra/ui-pro`'s FloatingTableOfContents beside a short
 *          article of four sections, a column of bars that opens a list of section links on a press (or on hover),
 *          marks the current section and moves to the section chosen.
 * Boundary: presentation and local state only. The current section is the one last chosen; the page does not track
 *          the scroll position. The trigger opens on a press, so the keyboard reaches it.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra/ui-pro/react";
import { useState } from "react";

import { ProFloatingTableOfContentsRoute } from "#src/routes/pro-floating-table-of-contents/pro-floating-table-of-contents.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-floating-table-of-contents.*` keys.
const STRINGS = {
  documentTitle: `${ProFloatingTableOfContentsRoute.title} · Stackra Playground`,
  intro:
    "A table of contents that floats beside an article. Press the bars to open the list, choose a section to move to it; the current section is highlighted.",
  contents: "Table of contents",
  article: "Article",
  current: (title: string) => `Current section: ${title}`,
} as const;

const SECTIONS = [
  {
    id: "overview",
    title: "Overview",
    text: "The design system ships tokens, components and a playground that checks them.",
  },
  {
    id: "installation",
    title: "Installation",
    text: "Add the package to a member and import its stylesheet once in the entry.",
  },
  {
    id: "usage",
    title: "Usage",
    text: "Compose the parts of a component with dot notation and name every control.",
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    text: "If a style does not apply, check that the tokens stylesheet loads before the components'.",
  },
] as const;

/** The FloatingTableOfContents page. */
export function ProFloatingTableOfContents() {
  const [active, setActive] = useState<string>(SECTIONS[0].id);
  const title = SECTIONS.find((section) => section.id === active)?.title ?? "";

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProFloatingTableOfContentsRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <p role="status">
        <bdi>{STRINGS.current(title)}</bdi>
      </p>
      <div className="flex items-start justify-between gap-8">
        <div className="grid max-w-prose gap-6">
          {SECTIONS.map((section) => (
            <section key={section.id} aria-labelledby={`toc-${section.id}`} className="grid gap-2">
              <h2 id={`toc-${section.id}`} className="type-h2">
                {section.title}
              </h2>
              <p>
                <bdi>{section.text}</bdi>
              </p>
            </section>
          ))}
        </div>
        <UiPro.FloatingTableOfContents triggerMode="press">
          <UiPro.FloatingTableOfContents.Trigger label={STRINGS.contents}>
            {SECTIONS.map((section) => (
              <UiPro.FloatingTableOfContents.Bar
                key={section.id}
                isActive={section.id === active}
              />
            ))}
          </UiPro.FloatingTableOfContents.Trigger>
          <UiPro.FloatingTableOfContents.Content>
            {SECTIONS.map((section) => (
              <UiPro.FloatingTableOfContents.Item
                key={section.id}
                isActive={section.id === active}
                onClick={() => {
                  setActive(section.id);
                  document.getElementById(`toc-${section.id}`)?.scrollIntoView({ block: "start" });
                }}
              >
                {section.title}
              </UiPro.FloatingTableOfContents.Item>
            ))}
          </UiPro.FloatingTableOfContents.Content>
        </UiPro.FloatingTableOfContents>
      </div>
    </article>
  );
}
