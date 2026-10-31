/**
 * Stackra file contract:
 * Purpose: the category rail of the components index: a row of pills (All, then the thirteen categories in
 *          `CATEGORIES` order), each with its glyph and its count, sticky under the top bar (`.category-rail`, with a
 *          background and a hairline once stuck) and scrolling sideways with faded edges when it overflows. On a
 *          category's page its pill is the current page and the pills are links (`/components[/:category]`). On All
 *          the rail is scroll-spied (`useActiveSection`, the TOC rail's spy): the pill of the shelf being read is
 *          lit, and a pill jumps to its shelf (`scrollToSection`) instead of filtering; a modified click still opens
 *          the category's page.
 * Boundary: navigation only. Every link keeps the URL's search params so the scheme and direction carry over.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) sections 3.1 and 3.2; STA-1371 (owner, 2026-10-29: icons,
 *          sticky rail, no in-page search).
 */
import { byCategory, CATEGORIES, categoryKeys, categoryPath } from "@stackra/showcase";
import type { I18nKey } from "@stackra/i18n";
import { Icon, useCatalogueText } from "@stackra/ui/react";
import { useEffect, useRef, type MouseEvent } from "react";
import { Link, useLocation } from "react-router";

import { CategoryGlyph } from "#src/components/category-glyph";
import type { CategoryTabsProps } from "#src/components/category-tabs/category-tabs.props";
import { scrollToSection, useActiveSection } from "#src/components/toc-rail";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";

/** The showcase keys. */
const K = SHOWCASE_KEYS.showcase;

/** The shelf heading ids the rail spies on All (`CategoryShelf` writes them). */
const SHELF_IDS = CATEGORIES.map(({ id }) => `category-${id}`);

/** A click the browser should handle itself (a new tab or window). */
const isModified = (event: MouseEvent) =>
  event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

/** The category rail. */
export function CategoryTabs({ category }: CategoryTabsProps) {
  const t = useCatalogueText(MESSAGES.en);
  const { search } = useLocation();
  const isAll = category === undefined;
  // The spy runs on All only; on a category's page it has no shelves to find and stays on the first id, unused.
  const spied = useActiveSection(isAll ? SHELF_IDS : []);
  const list = useRef<HTMLUListElement>(null);

  // The lit pill is kept in view inside the sideways-scrolling row as the reader moves down the page. Only the row
  // scrolls, and only when the pill is cut: `scrollIntoView` would also scroll the window, cancelling a pill's smooth
  // jump half-way (the spy then lit the shelf it stopped on, which moved the row again).
  useEffect(() => {
    const row = list.current;
    const pill = row?.querySelector<HTMLElement>("[aria-current]:not([data-route])");
    if (!row || !pill) return;
    const box = row.getBoundingClientRect();
    const own = pill.getBoundingClientRect();
    const edge = 12; // the row's padding, which the edge fade covers
    if (own.left >= box.left + edge && own.right <= box.right - edge) return;
    const delta =
      own.left < box.left + edge ? own.left - box.left - edge : own.right - box.right + edge;
    row.scrollBy?.({ left: delta, behavior: "instant" });
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- the spied shelf and the category are the triggers: the lit pill is scrolled into view when either changes
  }, [spied, category]);

  const pills = [
    {
      id: undefined,
      label: t(K.ui.all),
      count: CATEGORIES.reduce((sum, { id }) => sum + byCategory(id).length, 0),
    },
    ...CATEGORIES.map(({ id }) => ({
      id,
      label: t(categoryKeys(id).title as I18nKey),
      count: byCategory(id).length,
    })),
  ];

  return (
    <nav aria-label={t(K.ui.components)} className="category-rail">
      <div>
        <ul ref={list} className="category-rail-row">
          {pills.map(({ id, label, count }) => {
            const shelf = id === undefined ? undefined : `category-${id}`;
            // On a category's page its pill is the page; on All the shelf being read is the location, and All
            // stays marked as the page the reader is on (`data-route`), drawn quieter than the lit shelf.
            const current = isAll
              ? id === undefined
                ? "page"
                : shelf === spied
                  ? "location"
                  : undefined
              : id === category
                ? "page"
                : undefined;
            return (
              <li key={id ?? "all"}>
                <Link
                  to={`${categoryPath(id)}${search}`}
                  className="category-pill"
                  {...(current ? { "aria-current": current } : {})}
                  {...(isAll && id === undefined ? { "data-route": "" } : {})}
                  onClick={(event) => {
                    if (!isAll || isModified(event)) return;
                    event.preventDefault();
                    if (shelf) scrollToSection(shelf);
                    else window.scrollTo({ top: 0 });
                  }}
                >
                  {id === undefined ? (
                    <Icon name={Icons.LayoutGrid} size="sm" />
                  ) : (
                    <CategoryGlyph category={id} className="size-4" />
                  )}
                  <span>{label}</span>
                  <span className="category-pill-count">{count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
