/**
 * Stackra file contract:
 * Purpose: the index page's gallery: one glass panel per category, listing its pages as rows (in `PageCategory`
 *          order, each with a line on what it holds and its count), free pages first and Pro ones badged, behind an
 *          All / Free / Pro filter. It is the playground's page navigation (`nav` "Pages") on the index.
 * Boundary: layout, links and the filter only; a category with no page in the chosen tier is left out. Each link
 *          keeps the URL's search params so the scheme and direction carry over. A category with no line below
 *          still lists, so a new category needs no edit here.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0294 (decision 14); the catalogue taxonomy (2026-10-24).
 */
import type { HeadingLevel } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useState } from "react";

import { CategoryGlyph } from "#src/components/category-glyph";
import { Choice } from "#src/components/choice";
import { PageCategory } from "#src/enums/page-category.enum";
import {
  matchesTier,
  TIER_FILTERS,
  tierOf,
  type TierFilter,
} from "#src/components/playground-pages/page-tier";
import type { PageLink } from "#src/types/page-link.type";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::gallery.*` keys.
const TIER_LABELS = { all: "All", free: "Free", pro: "Pro" } as const;

const STRINGS = {
  pages: "Pages",
  tier: "Show",
  tiers: TIER_LABELS,
  count: (count: number) => (count === 1 ? "1 page" : `${count} pages`),
  none: "No page in this tier yet.",
  shown: (count: number, tier: TierFilter) =>
    `${count === 1 ? "1 page" : `${count} pages`} shown${tier === "all" ? "" : `, ${TIER_LABELS[tier]} only`}.`,
} as const;

/** One line per category on what it holds; a category missing here lists without one. */
const CATEGORY_NOTES: Readonly<Record<string, string>> = {
  Foundations:
    "Colour, type, spacing, radius and motion: the tokens every component is drawn from.",
  Actions: "Buttons and links that start something.",
  Navigation: "Links, breadcrumbs, tabs and the ways between pages.",
  Selection: "Checkboxes, radios, switches, selects and tags.",
  Overlays: "Dialogs, drawers, popovers, menus and tooltips.",
  "Inputs and forms": "Fields, groups and whole forms with validation.",
  "Date and time": "Calendars, pickers and agendas.",
  Charts: "Area, bar, line, pie and radial charts on the theme's colours.",
  "Data display": "Avatars, badges, cards, chips, grids and lists.",
  "Feedback and status": "Spinners, skeletons, ratings and the states that say what is happening.",
  Layout: "Surfaces, separators and resizable panes.",
  AI: "Conversations, prompts, sources and streamed text.",
};

/** Props of {@link PageGallery}. */
export interface PageGalleryProps {
  /** The pages to show, in navigation order. */
  pages: readonly PageLink[];
  /** The URL search params each card keeps. */
  search: string;
  /** The heading level of each category name. */
  headingLevel: HeadingLevel;
}

/** The two-letter mark a card wears: the initials of a two-word title, else its first two letters. */
function monogram(title: string) {
  const words = title.split(/\s+/);
  return (words.length > 1 ? `${words[0]?.[0]}${words[1]?.[0]}` : title.slice(0, 2)).toUpperCase();
}

/** The gallery of pages by category. */
export function PageGallery({ pages, search, headingLevel }: PageGalleryProps) {
  const [tier, setTier] = useState<TierFilter>("all");
  const shown = pages.filter((page) => matchesTier(tierOf(page.path), tier));

  return (
    <div className="grid gap-8">
      <Ui.ToggleButtonGroup
        aria-label={STRINGS.tier}
        size="sm"
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[tier]}
        onSelectionChange={(keys) => {
          const picked = TIER_FILTERS.find((choice) => keys.has(choice));
          if (picked) setTier(picked);
        }}
        className="justify-self-start"
      >
        {TIER_FILTERS.map((choice) => (
          <Choice key={choice} id={choice}>
            {STRINGS.tiers[choice]}
          </Choice>
        ))}
      </Ui.ToggleButtonGroup>
      {/* The filter changes the list in place, so its result is announced. */}
      <p role="status" className="sr-only">
        {STRINGS.shown(shown.length, tier)}
      </p>
      <nav aria-label={STRINGS.pages} className="columns-1 gap-4 md:columns-2 xl:columns-3">
        {shown.length === 0 ? <Ui.Text tone="muted">{STRINGS.none}</Ui.Text> : null}
        {PageCategory.map((category) => {
          const inCategory = shown.filter((page) => page.category === category);
          if (inCategory.length === 0) return null;
          const id = `category-${category.toLowerCase().replaceAll(/\W+/g, "-")}`;
          return (
            <section
              key={category}
              aria-labelledby={id}
              className="material-thick mb-4 grid break-inside-avoid gap-3 rounded-3xl p-4"
            >
              <div className="grid gap-1 px-2 pt-1">
                <div className="flex items-center justify-between gap-4">
                  <span
                    aria-hidden="true"
                    className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"
                  >
                    <CategoryGlyph category={category} className="size-5" />
                  </span>
                  <Ui.Heading id={id} level={headingLevel} className="flex-1">
                    {category}
                  </Ui.Heading>
                  <span className="shrink-0 font-mono text-xs text-muted">
                    {STRINGS.count(inCategory.length)}
                  </span>
                </div>
                {CATEGORY_NOTES[category] ? (
                  <Ui.Text tone="muted" className="text-sm">
                    <bdi>{CATEGORY_NOTES[category]}</bdi>
                  </Ui.Text>
                ) : null}
              </div>
              <ul aria-label={category} className="grid">
                {inCategory.map((page) => (
                  <li key={page.path}>
                    <Ui.Link
                      href={`${page.path}${search}`}
                      underline="hover"
                      className="group flex w-full items-center gap-3 rounded-2xl p-2 hover:bg-default hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-surface-secondary font-mono text-xs font-semibold"
                      >
                        {monogram(page.title)}
                      </span>
                      <span className="flex-1 font-medium">{page.title}</span>
                      {tierOf(page.path) === "Pro" ? (
                        <Ui.Chip size="sm" variant="soft" tone="accent">
                          {STRINGS.tiers.pro}
                        </Ui.Chip>
                      ) : null}
                      <span className="text-muted opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100 motion-reduce:transition-none rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5">
                        <Ui.Icon name="chevron-right" size="sm" />
                      </span>
                    </Ui.Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </nav>
    </div>
  );
}
