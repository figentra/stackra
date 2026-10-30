/**
 * Stackra file contract:
 * Purpose: the sidebar of a component page: a filter box, then the web pages in collapsible category groups
 *          (`CATEGORIES` order, `byCategory` within), each header the category title and its count, each row the
 *          page title, the Advanced chip of a specialist entry and the status chip, ending at the row's end edge. The current page is marked
 *          (`aria-current="page"`: the soft accent with a start-edge bar, on the control radius: `.sidebar-row` in the app stylesheet), its group opens on its own and, when the row is
 *          out of view, the sidebar scrolls to show it with its whole group, label first. The groups are an
 *          accordion: one is open at a time, so opening another closes the one before (STA-1371). While the filter has
 *          words, every group with a match is open. The arrow keys, Home and End move between the rows. The list keeps a
 *          gutter on both edges, so the row fill and the filter's border never touch the clipping edge, and fades at the
 *          edge it scrolls under. On a wide screen it is the first column; below `lg` the shell puts the
 *          same component in the menu drawer.
 * Boundary: links only; every link keeps the URL's search params. Entries without a web page (native only, planned)
 *           are left out: a sidebar is navigation.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 3.2; WCAG 2.2 SC 2.4.8, 1.4.1, 4.1.2.
 */
import {
  byCategory,
  CATEGORIES,
  categoryKeys,
  componentKeys,
  webPath,
  type ComponentCategory,
} from "@stackra/showcase";
import type { I18nKey } from "@stackra/i18n";
import { Button, Chip, Icon, Link, SearchField, useCatalogueText } from "@stackra/ui/react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useLocation } from "react-router";

import { StatusChip } from "#src/components/status-chip";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";
import type { SidebarProps } from "#src/components/sidebar/sidebar.props";

/** The showcase keys. */
const K = SHOWCASE_KEYS.showcase;

/** The categories with the entries that have a web page, in navigation order. */
const GROUPS = [...CATEGORIES]
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  .sort((a, b) => a.order - b.order)
  .map(({ id }) => ({
    id,
    entries: byCategory(id, { platform: "react" }).filter((entry) => entry.status !== "planned"),
  }))
  .filter(({ entries }) => entries.length > 0);

/**
 * Scrolls the nearest scrolling box around `row` so the row shows, and its whole group (the category label included)
 * with it when the group fits; nothing moves while the row is already in view. Only that box scrolls, never the page.
 */
function revealWithGroup(row: HTMLElement) {
  let box = row.parentElement;
  while (box && !/auto|scroll/.test(getComputedStyle(box).overflowY)) box = box.parentElement;
  // The group's <li>: the row's <li> sits in the group's list, which sits in it.
  const group = row.parentElement?.parentElement;
  if (!box || !group) return;
  const view = box.getBoundingClientRect();
  const item = row.getBoundingClientRect();
  if (item.top >= view.top && item.bottom <= view.bottom) return;
  const { top, bottom } = group.getBoundingClientRect();
  // The least move that shows the whole group, its label first; then the row, if the group is taller than the box.
  const delta = Math.max(
    Math.min(Math.max(0, bottom - view.bottom), top - view.top),
    item.bottom - view.bottom,
  );
  box.scrollBy({ top: delta });
}

/** The keys that move focus between the sidebar's rows, and where each one goes. */
const ROW_KEYS: Readonly<Record<string, (index: number, count: number) => number>> = {
  ArrowDown: (index, count) => Math.min(index + 1, count - 1),
  ArrowUp: (index) => Math.max(index - 1, 0),
  Home: () => 0,
  End: (_, count) => count - 1,
};

/** Arrow keys, Home and End move focus between the group headers and the page links, as in a tree. */
function onRowKeyDown(event: KeyboardEvent<HTMLUListElement>) {
  const move = ROW_KEYS[event.key];
  if (!move) return;
  const rows = [
    ...event.currentTarget.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
  ];
  const index = rows.indexOf(document.activeElement as HTMLElement);
  if (index < 0) return;
  event.preventDefault();
  rows[move(index, rows.length)]?.focus();
}

/** The sidebar of the component pages. */
export function Sidebar({ current, className }: SidebarProps) {
  const t = useCatalogueText(MESSAGES.en);
  const { search } = useLocation();
  const [query, setQuery] = useState("");
  // The one open group (an accordion); none once the reader closes it.
  const [open, setOpen] = useState<ComponentCategory | undefined>(current?.category);
  const currentLink = useRef<HTMLLIElement>(null);

  // A page opened from elsewhere opens its group (closing the one open before) and, only when its row is out of view,
  // scrolls the sidebar to it.
  useEffect(() => {
    if (!current) return;
    // oxlint-disable-next-line react/set-state-in-effect -- reason: a navigation from elsewhere opens the new page's group; the reader can still close it, so it is not derived state
    setOpen(current.category);
    requestAnimationFrame(() => {
      const row = currentLink.current;
      if (row) revealWithGroup(row);
    });
  }, [current]);

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const toggle = (id: ComponentCategory) => setOpen((was) => (was === id ? undefined : id));

  return (
    <nav aria-label={t(K.ui.components)} className={`playground-sidebar ${className ?? ""}`}>
      <SearchField
        aria-label={t(K.ui.filter)}
        placeholder={t(K.ui.filter)}
        variant="secondary"
        isFullWidth
        value={query}
        onChange={setQuery}
      />
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- reason: delegation only; the arrow keys move between the links and buttons the list holds */}
      <ul className="grid gap-2" onKeyDown={onRowKeyDown}>
        {GROUPS.map(({ id, entries }) => {
          const label = t(categoryKeys(id).title as I18nKey);
          const rows = entries
            .map((entry) => ({ entry, title: t(componentKeys(entry).title as I18nKey) }))
            .filter(({ entry, title }) => {
              const text = `${title} ${entry.slug} ${entry.keywords.join(" ")}`.toLowerCase();
              return words.every((word) => text.includes(word));
            });
          if (rows.length === 0) return null;
          const isOpen = words.length > 0 || open === id;
          const listId = `sidebar-${id}`;
          return (
            <li key={id} className="grid">
              <Button
                variant="ghost"
                size="sm"
                aria-expanded={isOpen}
                aria-controls={listId}
                isDisabled={words.length > 0}
                onPress={() => toggle(id)}
                className="w-full justify-start gap-2 px-2 text-xs font-semibold tracking-wide text-muted"
              >
                <Icon
                  name="chevron-down"
                  size="sm"
                  className={`shrink-0 transition-transform motion-reduce:transition-none ${isOpen ? "" : "-rotate-90 rtl:rotate-90"}`}
                />
                <span className="min-w-0 flex-1 truncate text-start">{label}</span>
                <span className="tabular-nums">{rows.length}</span>
              </Button>
              {isOpen ? (
                <ul id={listId} aria-label={label} className="grid gap-0.5 pt-1 pb-2">
                  {rows.map(({ entry, title }) => {
                    const isCurrent = current?.tier === entry.tier && current.slug === entry.slug;
                    return (
                      <li
                        key={`${entry.tier}-${entry.slug}`}
                        ref={isCurrent ? currentLink : undefined}
                      >
                        <Link
                          href={`${webPath(entry)}${search}`}
                          underline="hover"
                          {...(isCurrent ? { "aria-current": "page" as const } : {})}
                          className="sidebar-row"
                        >
                          <span className="min-w-0 flex-1 truncate">{title}</span>
                          {entry.advanced ? (
                            <Chip size="sm" variant="soft">
                              {t(K.ui.advanced)}
                            </Chip>
                          ) : null}
                          <StatusChip status={entry.status} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
