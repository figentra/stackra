/**
 * Stackra file contract:
 * Purpose: the index page's gallery: one glass panel per category, listing its pages as rows (in `PageCategory`
 *          order, each with a line on what it holds and its count). It is the playground's page navigation (`nav`
 *          "Pages") on the index.
 * Boundary: layout and links only; a category with no page is left out. Each link
 *          keeps the URL's search params so the scheme and direction carry over. A category with no line below
 *          still lists, so a new category needs no edit here.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0294 (decision 14); the catalogue taxonomy (2026-10-24).
 */
import { Heading, Icon, Link, Text } from "@stackra/ui/react";

import { CategoryGlyph } from "#src/components/category-glyph";
import { PageCategory } from "#src/enums/page-category.enum";
import type { PageGalleryProps } from "#src/components/page-gallery/page-gallery.props";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::gallery.*` keys.
const STRINGS = {
  pages: "Pages",
  count: (count: number) => (count === 1 ? "1 page" : `${count} pages`),
  none: "No page yet.",
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

/** The two-letter mark a card wears: the initials of a two-word title, else its first two letters. */
function monogram(title: string) {
  const words = title.split(/\s+/);
  return (words.length > 1 ? `${words[0]?.[0]}${words[1]?.[0]}` : title.slice(0, 2)).toUpperCase();
}

/** The gallery of pages by category. */
export function PageGallery({ pages, search, headingLevel }: PageGalleryProps) {
  return (
    <div className="grid gap-8">
      <nav aria-label={STRINGS.pages} className="columns-1 gap-4 md:columns-2 xl:columns-3">
        {pages.length === 0 ? <Text tone="muted">{STRINGS.none}</Text> : null}
        {PageCategory.map((category) => {
          const inCategory = pages.filter((page) => page.category === category);
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
                  <Heading id={id} level={headingLevel} className="flex-1">
                    {category}
                  </Heading>
                  <span className="shrink-0 font-mono text-xs text-muted">
                    {STRINGS.count(inCategory.length)}
                  </span>
                </div>
                {CATEGORY_NOTES[category] ? (
                  <Text tone="muted" className="text-sm">
                    <bdi>{CATEGORY_NOTES[category]}</bdi>
                  </Text>
                ) : null}
              </div>
              <ul aria-label={category} className="grid">
                {inCategory.map((page) => (
                  <li key={page.path}>
                    <Link
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
                      <span className="text-muted opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100 motion-reduce:transition-none rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5">
                        <Icon name="chevron-right" size="sm" />
                      </span>
                    </Link>
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
