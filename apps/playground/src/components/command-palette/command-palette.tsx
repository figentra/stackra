/**
 * Stackra file contract:
 * Purpose: the playground's command palette, a launcher in a modal glass dialog.
 *          - One large search field drives a list of results; focus stays in the field while an active row moves
 *            (the combobox pattern).
 *          - Empty, it offers the recent pages, the quick actions (scheme, language, places) and every page by
 *            category. Typed, it ranks pages and actions by how well their names match (start of the name, start of
 *            a word, anywhere), and marks the match.
 *          - Each page row wears its category's brand glyph, its category and a "Pro" badge; a preview of the active
 *            row sits beside the list on a wide screen.
 *          - ↑ ↓ move, Enter opens, Escape or the scrim closes. The shell opens it from its search button, ⌘K or
 *            Ctrl+K, and `/`.
 * Boundary: the dialog, the ranking and the recent list (this browser only, in localStorage, guarded) only; the shell
 *          owns whether it is open, supplies the actions and closes it on a route change. A native input carries
 *          the combobox semantics, which @stackra/ui's SearchField does not expose.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); WAI-ARIA 1.2 combobox and listbox; WCAG 2.2 SC 2.1.1, 2.4.3, 4.1.2, 4.1.3.
 */
import type { IconName } from "@stackra/icons/contracts";
import * as Ui from "@stackra/ui/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { useNavigate } from "react-router";

import { CategoryGlyph } from "#src/components/category-glyph";
import { PageCategory } from "#src/enums/page-category.enum";
import type { PageLink } from "#src/types/page-link.type";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::palette.*` keys.
const STRINGS = {
  label: "Search components",
  placeholder: "Search components, categories and actions…",
  results: "Results",
  recent: "Recent",
  actions: "Quick actions",
  best: "Best matches",
  count: (count: number) => (count === 1 ? "1 result" : `${count} results`),
  empty: (query: string) => `Nothing matches “${query}”.`,
  emptyHint: "Try a component, a category such as Selection, or an action such as Dark.",
  page: "Page",
  action: "Action",
  open: "Open",
  run: "Run",
  pro: "Pro",
  hints: [
    { keys: ["arrow-up", "arrow-down"], action: "move" },
    { keys: ["corner-down-left"], action: "open" },
    { keys: ["esc"], action: "close" },
  ],
} as const;

/** The pages kept in the recent list, newest first, and where. */
const RECENT_KEY = "stackra-playground:recent";
const RECENT_SIZE = 5;

/** A command the shell offers in the palette: switch the scheme, the language, go somewhere. */
export interface PaletteAction {
  /** A stable id, unique among the actions. */
  readonly id: string;
  /** What the row says. */
  readonly label: string;
  /** A short line under it. */
  readonly detail: string;
  /** The icon, by name. */
  readonly icon: IconName;
  /** Other words it is found by. */
  readonly keywords?: string;
  /** Carries the action out; the palette closes after it. */
  readonly run: () => void;
}

/** Props of {@link CommandPalette}. */
export interface CommandPaletteProps {
  /** Every page, in navigation order. */
  pages: readonly PageLink[];
  /** The quick actions. */
  actions: readonly PaletteAction[];
  /** The URL search params each page link keeps. */
  search: string;
  /** Whether the palette is open. */
  isOpen: boolean;
  /** Called when the palette closes itself (Escape, the scrim, a run). */
  onClose: () => void;
}

/** One row: a page or an action. */
interface Item {
  readonly id: string;
  readonly kind: "page" | "action";
  readonly label: string;
  readonly detail: string;
  readonly keywords: string;
  readonly page?: PageLink;
  readonly action?: PaletteAction;
}

/** A titled group of rows. */
interface Group {
  readonly title: string;
  readonly items: readonly Item[];
}

const readRecent = (): readonly string[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((path) => typeof path === "string") : [];
  } catch {
    return [];
  }
};

const remember = (path: string) => {
  try {
    const next = [path, ...readRecent().filter((recent) => recent !== path)].slice(0, RECENT_SIZE);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // shortcut: a browser that refuses storage keeps no recent list; nothing else depends on it.
  }
};

/** How well `item` matches every word: −1 when one is missing, more when names start with the words. */
function score(item: Item, words: readonly string[]): number {
  const label = item.label.toLowerCase();
  const text = `${label} ${item.detail.toLowerCase()} ${item.keywords}`;
  let total = 0;
  for (const word of words) {
    if (!text.includes(word)) return -1;
    if (label.startsWith(word)) total += 4;
    else if (label.split(/[\s-]+/).some((part) => part.startsWith(word))) total += 2;
    else if (label.includes(word)) total += 1;
  }
  return total;
}

/** `label` with the first match of any word in bold. */
function Marked({ label, words }: { label: string; words: readonly string[] }) {
  const lower = label.toLowerCase();
  const word = words.find((candidate) => lower.includes(candidate));
  if (!word) return <>{label}</>;
  const at = lower.indexOf(word);
  return (
    <>
      {label.slice(0, at)}
      <mark className="bg-transparent font-semibold text-foreground underline decoration-2 underline-offset-2">
        {label.slice(at, at + word.length)}
      </mark>
      {label.slice(at + word.length)}
    </>
  );
}

/** The leading tile of a row: the page's category glyph or the action's icon. */
function Tile({ item, size = "size-9" }: { item: Item; size?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid ${size} shrink-0 place-items-center rounded-xl border border-border bg-surface-secondary`}
    >
      {item.page ? (
        <CategoryGlyph category={item.page.category} className="size-[45%]" />
      ) : item.action ? (
        <Ui.Icon name={item.action.icon} size="sm" />
      ) : null}
    </span>
  );
}

/** A key cap: a word, or a drawn arrow (a symbol character is one a contrast checker cannot measure). */
function Key({ name }: { name: string }) {
  return (
    <kbd
      aria-hidden="true"
      dir="ltr"
      className="inline-flex min-h-5 items-center rounded-md border border-border px-1.5 font-mono text-xs"
    >
      {name === "esc" ? name : <Ui.Icon name={name as IconName} size="sm" />}
    </kbd>
  );
}

/** The launcher of the playground. */
export function CommandPalette({ pages, actions, search, isOpen, onClose }: CommandPaletteProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<readonly string[]>([]);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (isOpen && !element.open) {
      setQuery("");
      setActive(0);
      setRecent(readRecent());
      element.showModal();
    } else if (!isOpen && element.open) element.close();
  }, [isOpen]);

  const pageItems: Item[] = pages.map((page) => ({
    id: `page${page.path.replaceAll("/", "-")}`,
    kind: "page",
    label: page.title,
    detail: page.category,
    keywords: `${page.tier ?? ""} ${page.path}`.toLowerCase(),
    page,
  }));
  const actionItems: Item[] = actions.map((action) => ({
    id: `action-${action.id}`,
    kind: "action",
    label: action.label,
    detail: action.detail,
    keywords: (action.keywords ?? "").toLowerCase(),
    action,
  }));

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const groups: readonly Group[] =
    words.length > 0
      ? [
          {
            title: STRINGS.best,
            items: [...pageItems, ...actionItems]
              .map((item, order) => ({ item, order, rank: score(item, words) }))
              .filter(({ rank }) => rank >= 0)
              .sort((a, b) => b.rank - a.rank || a.order - b.order)
              .map(({ item }) => item),
          },
        ]
      : [
          {
            title: STRINGS.recent,
            // Copies with their own ids: a recent page also lists under its category, as a row of its own.
            items: recent.flatMap((path) =>
              pageItems
                .filter((item) => item.page?.path === path)
                .map((item) => ({ ...item, id: `recent-${item.id}` })),
            ),
          },
          { title: STRINGS.actions, items: actionItems },
          ...PageCategory.map((category) => ({
            title: category,
            items: pageItems.filter((item) => item.page?.category === category),
          })),
        ];
  const shown = groups.filter((group) => group.items.length > 0);
  const flat = shown.flatMap((group) => group.items);
  const current = flat[Math.min(active, flat.length - 1)];
  const optionId = (item: Item) => `${listId}-${item.id}`;

  // The active row stays in view as the arrows move it.
  useEffect(() => {
    if (current) document.getElementById(optionId(current))?.scrollIntoView?.({ block: "nearest" });
  });

  const run = (item: Item | undefined) => {
    if (!item) return;
    if (item.page) {
      remember(item.page.path);
      void navigate(`${item.page.path}${search}`);
    }
    item.action?.run();
    onClose();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      run(current);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (flat.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((Math.min(active, flat.length - 1) + step + flat.length) % flat.length);
    }
  };

  // A click on the dialog box itself, outside its panel, is a click on the scrim.
  const onScrim = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <dialog
      ref={dialog}
      aria-label={STRINGS.label}
      onClose={onClose}
      onClick={onScrim}
      className="command-palette material-thick m-auto mt-[10vh] w-[min(100%-2rem,54rem)] max-w-none overflow-hidden rounded-3xl p-0 text-foreground"
    >
      {isOpen ? (
        <div className="grid max-h-[min(76vh,42rem)] grid-rows-[auto_minmax(0,1fr)_auto]">
          <div className="flex items-center gap-3 border-b border-separator px-5 py-4">
            <Ui.Icon name="search" tone="muted" />
            <input
              type="text"
              role="combobox"
              aria-label={STRINGS.label}
              aria-expanded={flat.length > 0}
              {...(flat.length > 0 ? { "aria-controls": listId } : {})}
              aria-autocomplete="list"
              aria-activedescendant={current ? optionId(current) : undefined}
              placeholder={STRINGS.placeholder}
              autoComplete="off"
              spellCheck={false}
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              className="min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-muted"
            />
            <Key name="esc" />
          </div>
          <div className="grid min-h-0 md:grid-cols-[minmax(0,1fr)_16rem]">
            {/* With nothing to list there is no listbox: an empty one would hold no option (ARIA 1.2). */}
            {flat.length === 0 ? (
              <div className="grid content-center justify-items-center gap-1 px-4 py-12 text-center">
                <p className="font-medium">
                  <bdi>{STRINGS.empty(query)}</bdi>
                </p>
                <p className="text-sm text-muted">
                  <bdi>{STRINGS.emptyHint}</bdi>
                </p>
              </div>
            ) : (
              <div
                id={listId}
                role="listbox"
                aria-label={STRINGS.results}
                className="min-h-0 overflow-y-auto overscroll-contain p-2"
              >
                {shown.map((group) => {
                  const headingId = `${listId}-${group.title.toLowerCase().replaceAll(/\W+/g, "-")}`;
                  return (
                    <div
                      key={group.title}
                      role="group"
                      aria-labelledby={headingId}
                      className="grid pb-2"
                    >
                      <p
                        id={headingId}
                        className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-muted"
                      >
                        {group.title}
                      </p>
                      {group.items.map((item) => {
                        const isActive = item === current;
                        return (
                          <div
                            key={item.id}
                            id={optionId(item)}
                            role="option"
                            aria-selected={isActive}
                            // Only a pointer that moves picks a row: content scrolling under a still pointer does not.
                            onPointerMove={(event) => {
                              if (event.movementX !== 0 || event.movementY !== 0)
                                setActive(flat.indexOf(item));
                            }}
                            onClick={() => run(item)}
                            className={`flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 ${isActive ? "bg-default" : ""}`}
                          >
                            <Tile item={item} />
                            <span className="grid min-w-0 flex-1">
                              <span className="truncate font-medium">
                                <Marked label={item.label} words={words} />
                              </span>
                              <span className="truncate text-xs text-muted">{item.detail}</span>
                            </span>
                            {item.page?.tier === "Pro" ? (
                              <Ui.Chip size="sm" variant="soft" tone="accent">
                                {STRINGS.pro}
                              </Ui.Chip>
                            ) : null}
                            {isActive ? <Key name="corner-down-left" /> : null}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
            {/* The preview repeats what the active row says, bigger; screen readers have it from the row. */}
            <div
              aria-hidden="true"
              className="hidden border-s border-separator p-5 md:grid md:content-start md:gap-4"
            >
              {current ? (
                <>
                  <Tile item={current} size="size-16" />
                  <div className="grid gap-1">
                    <p className="text-lg font-semibold">{current.label}</p>
                    <p className="text-sm text-muted">{current.detail}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-border px-2 py-0.5">
                      {current.kind === "page" ? STRINGS.page : STRINGS.action}
                    </span>
                    {current.page ? (
                      <span
                        dir="ltr"
                        className="rounded-full border border-border px-2 py-0.5 font-mono"
                      >
                        {current.page.path}
                      </span>
                    ) : null}
                    {current.page?.tier === "Pro" ? (
                      <span className="rounded-full border border-border px-2 py-0.5">
                        {STRINGS.pro}
                      </span>
                    ) : null}
                  </div>
                  <p className="flex items-center gap-2 text-sm text-muted">
                    <Key name="corner-down-left" />
                    {current.kind === "page" ? STRINGS.open : STRINGS.run}
                  </p>
                </>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-separator px-5 py-2.5 text-xs text-muted">
            <ul aria-hidden="true" className="flex flex-wrap gap-4">
              {STRINGS.hints.map(({ keys, action }) => (
                <li key={action} className="flex items-center gap-1.5">
                  {keys.map((key) => (
                    <Key key={key} name={key} />
                  ))}
                  {action}
                </li>
              ))}
            </ul>
            <p role="status">{STRINGS.count(flat.length)}</p>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
