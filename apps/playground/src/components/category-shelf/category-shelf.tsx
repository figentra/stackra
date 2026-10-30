/**
 * Stackra file contract:
 * Purpose: one category's shelf of component cards: a header row (the category glyph, its name, the count and
 *          "View all" to its page), then its cards. On a phone (below `sm`) the cards are a swipeable row of big
 *          cards, 85% of the width with the next one peeking, snapping card by card (the row runs right to left in
 *          Arabic); from `sm` they are a grid of two per row, from `lg` three. On the category's own page (`isAlone`)
 *          the phone gets one full-width card per row and the description sits under the heading.
 * Boundary: presentation over the given entries and the `showcase` catalogue; every link keeps the URL's search.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) sections 3.1, 3.2 and 5; STA-1371 (listing by width,
 *          2026-10-28).
 */
import { categoryKeys, categoryPath } from "@stackra/showcase";
import type { I18nKey } from "@stackra/i18n";
import { Heading, Link, Text, useCatalogueText } from "@stackra/ui/react";
import { useLocation } from "react-router";

import { CategoryGlyph } from "#src/components/category-glyph";
import { ComponentCard } from "#src/components/component-card";
import type { CategoryShelfProps } from "#src/components/category-shelf/category-shelf.props";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";

/** The showcase keys. */
const K = SHOWCASE_KEYS.showcase;

/** The phone's swipeable row (bleeding into the page's 12px gutter), the grid from `sm`. */
const ROW =
  "-mx-3 flex snap-x snap-mandatory scroll-px-3 gap-3 overflow-x-auto overscroll-x-contain px-3 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-4 sm:gap-y-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3";

/** The grid of a category's own page: one card per row on a phone. */
const GRID = "grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3";

/** One category's header and cards. */
export function CategoryShelf({
  category,
  entries,
  headingLevel = 2,
  isAlone = false,
}: CategoryShelfProps) {
  const t = useCatalogueText(MESSAGES.en);
  const { search } = useLocation();
  const keys = categoryKeys(category);
  const id = `category-${category}`;
  return (
    <section aria-labelledby={id} className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <div className="grid gap-1">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center bg-accent text-accent-foreground"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            <CategoryGlyph category={category} className="size-5" />
          </span>
          <div className="grid min-w-0 flex-1">
            <Heading id={id} level={headingLevel} type="h4" className="truncate scroll-mt-32">
              {t(keys.title as I18nKey)}
            </Heading>
            <Text type="small" tone="muted">
              <bdi>{t(K.ui.count_components, { count: entries.length })}</bdi>
            </Text>
          </div>
          {isAlone ? null : (
            <Link
              href={`${categoryPath(category)}${search}`}
              underline="hover"
              // 24px tall: the WCAG 2.2 minimum target (SC 2.5.8) for a link beside other text.
              className="inline-flex min-h-6 shrink-0 items-center text-sm"
            >
              {t(K.ui.view_all)}
            </Link>
          )}
        </div>
        {isAlone ? (
          <Text tone="muted">
            <bdi>{t(keys.description as I18nKey)}</bdi>
          </Text>
        ) : null}
      </div>
      <ul className={isAlone ? GRID : ROW}>
        {entries.map((entry) => (
          <li
            key={`${entry.tier}/${entry.slug}`}
            className={isAlone ? "grid" : "grid w-[85%] shrink-0 snap-start sm:w-auto"}
          >
            <ComponentCard entry={entry} />
          </li>
        ))}
      </ul>
    </section>
  );
}
