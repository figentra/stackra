/**
 * Stackra file contract:
 * Purpose: the playground's command palette, a launcher in a modal dialog over the registry's search index, on a solid
 *          surface (only the scrim behind it blurs), so its muted text is measured against one colour.
 *          - One large search field drives a list of results; focus stays in the field while an active row moves
 *            (the combobox pattern). A Web / Native tag beside it narrows the index to one platform.
 *          - Empty, it offers the recent pages, the quick actions (scheme, language, places) and every component by
 *            category. Typed, it groups the hits as HeroUI's search does: Components (a title, keyword or
 *            description hit, the reason shown), Sections (a heading or prop hit, opening the page at that section)
 *            and Categories, then the matching quick actions.
 *          - Each component row wears its category's glyph, and its category; a preview of
 *            the active row sits beside the list on a wide screen.
 *          - ↑ ↓ move, Enter opens, Escape or the scrim closes. The shell opens it from its search button, ⌘K or
 *            Ctrl+K, and `/`.
 * Boundary: the dialog, the grouping and the recent list (shared with the home row) only; the shell owns whether it
 *          is open, supplies the actions and closes it on a route change. The ranking is the registry's
 *          `matchEntries`; the docs are `searchDocs` (the generated index once WP2 lands). A native input carries
 *          the combobox semantics, which @stackra/ui's SearchField does not expose.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); showcase redesign spec section 3.2 (Search); WAI-ARIA 1.2 combobox and
 *          listbox; WCAG 2.2 SC 2.1.1, 2.4.3, 4.1.2, 4.1.3.
 */
import type { IconName } from "@stackra/icons/contracts";
import type { I18nKey } from "@stackra/i18n";
import {
  byCategory,
  CATEGORIES,
  categoryKeys,
  categoryPath,
  matchEntries,
  webPath,
  type ComponentCategory,
  type ComponentTier,
  Platform,
  type SearchHit,
} from "@stackra/showcase";
import { Chip, Icon, ToggleButton, ToggleButtonGroup, useCatalogueText } from "@stackra/ui/react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useNavigate } from "react-router";

import { CategoryGlyph } from "#src/components/category-glyph";
import { PALETTE_KEYS } from "#src/components/command-palette/palette-keys.constant";
import { searchDocs } from "#src/components/command-palette/search-docs.function";
import { readRecent, rememberRecent } from "#src/components/recent-chips";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";
import type { CommandPaletteProps } from "#src/components/command-palette/command-palette.props";
import type { PaletteAction } from "#src/components/command-palette/palette-action.type";

/** The palette's keys and the showcase's. */
const P = PALETTE_KEYS.palette;
const S = SHOWCASE_KEYS.showcase;

/** The anchor a section hit opens: a prop hit lands on the API table, a heading hit on the examples. */
const SECTION_ANCHOR: Readonly<Partial<Record<SearchHit["reason"], string>>> = {
  prop: "api",
  heading: "examples",
};

/** The key hints in the footer. */
const HINTS = [
  { keys: ["arrow-up", "arrow-down"], action: "move" },
  { keys: ["corner-down-left"], action: "open" },
  { keys: ["esc"], action: "close" },
] as const;

/** One row: a component, a section of one, a category or an action. */
interface Item {
  readonly id: string;
  readonly kind: "component" | "section" | "category" | "action";
  readonly label: string;
  readonly detail: string;
  readonly keywords: string;
  readonly category?: ComponentCategory;
  readonly tier?: ComponentTier;
  /** Where the row goes; an action has none. */
  readonly href?: string;
  readonly action?: PaletteAction;
}

/** A titled group of rows. */
interface Group {
  readonly title: string;
  readonly items: readonly Item[];
}

/** How well an action matches every word: −1 when one is missing, more when the label starts with the words. */
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

/** The leading tile of a row: the category glyph or the action's icon. */
function Tile({ item, size = "size-9" }: { item: Item; size?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid ${size} shrink-0 place-items-center border border-border bg-surface-secondary`}
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      {item.category ? (
        <CategoryGlyph category={item.category} className="size-[45%]" />
      ) : item.action ? (
        <Icon name={item.action.icon} size="sm" />
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
      className="inline-flex min-h-5 items-center border border-border px-1.5 font-mono text-xs"
      style={{ borderRadius: "var(--radius-sm)" }}
    >
      {name === "esc" ? name : <Icon name={name as IconName} size="sm" />}
    </kbd>
  );
}

/** The launcher of the playground. */
export function CommandPalette({ locale, actions, search, isOpen, onClose }: CommandPaletteProps) {
  const t = useCatalogueText(MESSAGES.en);
  const dialog = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<Platform | undefined>();
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<readonly string[]>([]);
  const lang = locale.startsWith("ar") ? "ar" : "en";
  const docs = useMemo(() => searchDocs(MESSAGES[lang], lang), [lang]);

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

  const categoryTitle = (category: ComponentCategory) => t(categoryKeys(category).title as I18nKey);
  const componentItem = (doc: SearchHit["doc"], reason?: SearchHit, prefix = ""): Item => {
    const [tier, slug] = doc.key.split("/") as [ComponentTier, string];
    const detail = categoryTitle(doc.category);
    return {
      id: `${prefix}component-${tier}-${slug}`,
      kind: "component",
      label: doc.title,
      detail: reason
        ? `${detail} · ${t(S.search.reason[reason.reason], { name: reason.matched })}`
        : detail,
      keywords: "",
      category: doc.category,
      tier,
      href: `${webPath({ tier, slug })}${search}`,
    };
  };
  const actionItems: Item[] = actions.map((action) => ({
    id: `action-${action.id}`,
    kind: "action",
    label: action.label,
    detail: action.detail,
    keywords: (action.keywords ?? "").toLowerCase(),
    action,
  }));

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  let groups: readonly Group[];
  if (words.length > 0) {
    const hits = matchEntries(docs, query, platform ? { platform } : {});
    const sections = hits.filter((hit) => SECTION_ANCHOR[hit.reason]);
    groups = [
      {
        title: t(S.search.components),
        items: hits
          .filter((hit) => !SECTION_ANCHOR[hit.reason])
          .map((hit) => componentItem(hit.doc, hit)),
      },
      {
        title: t(S.search.sections),
        items: sections.map((hit) => {
          const item = componentItem(hit.doc, hit, "section-");
          return { ...item, kind: "section", href: `${item.href}#${SECTION_ANCHOR[hit.reason]}` };
        }),
      },
      {
        title: t(S.search.categories),
        items: CATEGORIES.map(({ id }) => ({
          id: `category-${id}`,
          kind: "category" as const,
          label: categoryTitle(id),
          detail: t(S.ui.count_components, { count: byCategory(id).length }),
          keywords: id.replaceAll("_", " "),
          category: id,
          href: `${categoryPath(id)}${search}`,
        })).filter((item) => score(item, words) >= 0),
      },
      {
        title: t(P.actions),
        items: actionItems
          .map((item, order) => ({ item, order, rank: score(item, words) }))
          .filter(({ rank }) => rank >= 0)
          // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
          .sort((a, b) => b.rank - a.rank || a.order - b.order)
          .map(({ item }) => item),
      },
    ];
  } else {
    const byKey = new Map(
      docs.map((doc) => [
        webPath({ tier: doc.tier, slug: doc.key.slice(doc.key.indexOf("/") + 1) }),
        doc,
      ]),
    );
    groups = [
      {
        title: t(P.recent),
        items: recent.flatMap((path) => {
          const doc = byKey.get(path);
          return doc ? [componentItem(doc, undefined, "recent-")] : [];
        }),
      },
      { title: t(P.actions), items: actionItems },
      ...CATEGORIES.map(({ id }) => ({
        title: categoryTitle(id),
        items: docs
          .filter((doc) => doc.category === id && (!platform || doc.platforms.includes(platform)))
          .map((doc) => componentItem(doc)),
      })),
    ];
  }
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
    if (item.href) {
      if (item.kind === "component") rememberRecent(item.href.split(/[?#]/)[0] ?? item.href);
      void navigate(item.href);
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

  const kindLabel = (kind: Item["kind"]) =>
    kind === "component"
      ? t(P.component)
      : kind === "section"
        ? t(P.section)
        : kind === "category"
          ? t(P.category)
          : t(P.action);

  return (
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- reason: a click on the scrim closes the dialog; Escape closes it natively
    <dialog
      ref={dialog}
      aria-label={t(P.label)}
      onClose={onClose}
      onClick={onScrim}
      className="command-palette m-auto mt-[10vh] border border-border bg-overlay shadow-overlay w-[min(100%-2rem,54rem)] max-w-none overflow-hidden p-0 text-foreground"
      style={{ borderRadius: "var(--radius-container)" }}
    >
      {isOpen ? (
        <div className="grid max-h-[min(76vh,42rem)] grid-rows-[auto_minmax(0,1fr)_auto]">
          <div className="flex items-center gap-3 border-b border-separator px-5 py-4">
            <Icon name="search" tone="muted" />
            <input
              type="text"
              // oxlint-disable-next-line jsx-a11y/role-has-required-aria-props -- reason: aria-controls is spread in only while the list is shown
              role="combobox"
              aria-label={t(P.label)}
              aria-expanded={flat.length > 0}
              {...(flat.length > 0 ? { "aria-controls": listId } : {})}
              aria-autocomplete="list"
              aria-activedescendant={current ? optionId(current) : undefined}
              placeholder={t(S.ui.search_placeholder)}
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
            <ToggleButtonGroup
              aria-label={t(P.platform)}
              size="sm"
              selectionMode="single"
              selectedKeys={platform ? [platform] : []}
              onSelectionChange={(keys) => {
                setPlatform(Platform.find((candidate) => keys.has(candidate)));
                setActive(0);
              }}
              className="max-sm:hidden"
            >
              {Platform.map((candidate) => (
                <ToggleButton key={candidate} id={candidate}>
                  {t(S.platform[candidate])}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Key name="esc" />
          </div>
          <div className="grid min-h-0 md:grid-cols-[minmax(0,1fr)_16rem]">
            {/* With nothing to list there is no listbox: an empty one would hold no option (ARIA 1.2). */}
            {flat.length === 0 ? (
              // With no row there is nothing to preview: the message takes the whole width, the hint on one line.
              <div className="grid content-center justify-items-center gap-1 px-4 py-12 text-center md:col-span-2">
                <p className="font-medium">
                  <bdi>{t(S.ui.no_results, { query })}</bdi>
                </p>
                <p className="text-sm text-muted">
                  <bdi>{t(P.empty_hint)}</bdi>
                </p>
              </div>
            ) : (
              <div
                id={listId}
                role="listbox"
                aria-label={t(P.results)}
                className="min-h-0 overflow-y-auto overscroll-contain p-2"
              >
                {shown.map((group, index) => {
                  // By position: an Arabic title has no \w letter to build a distinct id from.
                  const headingId = `${listId}-${index}`;
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
                          // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus -- reason: the input keeps the focus and moves the active option (aria-activedescendant)
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
                            className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${isActive ? "bg-default" : ""}`}
                            style={{ borderRadius: "var(--radius-control)" }}
                          >
                            <Tile item={item} />
                            <span className="grid min-w-0 flex-1">
                              <span className="truncate font-medium">
                                <Marked label={item.label} words={words} />
                              </span>
                              <span className="truncate text-xs text-muted">
                                <bdi>{item.detail}</bdi>
                              </span>
                            </span>
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
              className={`hidden border-s border-separator p-5 md:content-start md:gap-4 ${flat.length === 0 ? "" : "md:grid"}`}
            >
              {current ? (
                <>
                  <Tile item={current} size="size-16" />
                  <div className="grid gap-1">
                    <p className="text-lg font-semibold">{current.label}</p>
                    <p className="text-sm text-muted">
                      <bdi>{current.detail}</bdi>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Chip size="sm" variant="secondary">
                      {kindLabel(current.kind)}
                    </Chip>
                    {current.href ? (
                      <Chip size="sm" variant="secondary">
                        <bdi dir="ltr" className="font-mono">
                          {current.href.split("?")[0]}
                        </bdi>
                      </Chip>
                    ) : null}
                  </div>
                  <p className="flex items-center gap-2 text-sm text-muted">
                    <Key name="corner-down-left" />
                    {current.kind === "action" ? t(P.run) : t(P.open)}
                  </p>
                </>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-separator px-5 py-2.5 text-xs text-muted">
            <ul aria-hidden="true" className="flex flex-wrap gap-4">
              {HINTS.map(({ keys, action }) => (
                <li key={action} className="flex items-center gap-1.5">
                  {keys.map((key) => (
                    <Key key={key} name={key} />
                  ))}
                  {t(P[action])}
                </li>
              ))}
            </ul>
            <p role="status">{t(P.count, { count: flat.length })}</p>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
