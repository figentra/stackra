/**
 * Stackra file contract:
 * Purpose: the playground's command palette: a modal glass dialog with one search field over every page, the matches
 *          grouped by category (`PageList`), a live count, Enter to open the first match, the arrow keys to move
 *          between matches and Escape or the scrim to close. The shell opens it from its search button, ⌘K or Ctrl+K,
 *          and `/`.
 * Boundary: the dialog and the filter only; the shell owns whether it is open and closes it on a route change.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); WCAG 2.2 SC 2.1.1, 2.4.3, 4.1.3.
 */
import { SearchField } from "@stackra/ui/react";
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { useNavigate } from "react-router";

import { PageList } from "#src/components/page-list";
import type { PageLink } from "#src/types/page-link.type";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::palette.*` keys.
const STRINGS = {
  label: "Search components",
  placeholder: "Search components and categories…",
  results: (count: number) => (count === 1 ? "1 match" : `${count} matches`),
  empty: (query: string) => `Nothing matches “${query}”.`,
  hints: [
    ["↵", "open"],
    ["↑ ↓", "move"],
    ["esc", "close"],
  ],
} as const;

/** Props of {@link CommandPalette}. */
export interface CommandPaletteProps {
  /** Every page, in navigation order. */
  pages: readonly PageLink[];
  /** The URL search params each link keeps. */
  search: string;
  /** Whether the palette is open. */
  isOpen: boolean;
  /** Called when the palette closes itself (Escape, the scrim, a picked page). */
  onClose: () => void;
}

/** The pages whose title or category contains every word of `query`, ignoring case. */
function matching(pages: readonly PageLink[], query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return pages.filter((page) => {
    const text = `${page.title} ${page.category} ${page.tier ?? ""}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });
}

/** The search-everything dialog of the playground. */
export function CommandPalette({ pages, search, isOpen, onClose }: CommandPaletteProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const results = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const found = matching(pages, query);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (isOpen && !element.open) {
      setQuery("");
      element.showModal();
    } else if (!isOpen && element.open) element.close();
  }, [isOpen]);

  // A click on the dialog box itself, outside its panel, is a click on the scrim.
  const onScrim = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  // The arrows walk the matches; from the field, the first one.
  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const links = [...(results.current?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? [])];
    if (links.length === 0) return;
    event.preventDefault();
    const at = links.indexOf(document.activeElement as HTMLAnchorElement);
    const step = event.key === "ArrowDown" ? 1 : -1;
    const next = at === -1 ? (step === 1 ? 0 : links.length - 1) : at + step;
    links[(next + links.length) % links.length]?.focus();
  };

  return (
    <dialog
      ref={dialog}
      aria-label={STRINGS.label}
      onClose={onClose}
      onClick={onScrim}
      onKeyDown={onKeyDown}
      className="command-palette glass-strong m-auto mt-[12vh] w-[min(100%-2rem,40rem)] max-w-none rounded-3xl p-0 text-foreground"
    >
      {isOpen ? (
        <div className="grid max-h-[70vh] grid-rows-[auto_1fr_auto]">
          <div className="border-b border-separator p-3">
            <SearchField
              aria-label={STRINGS.label}
              placeholder={STRINGS.placeholder}
              isFullWidth
              autoFocus
              value={query}
              onChange={setQuery}
              onSubmit={() => {
                const first = found[0];
                if (first) void navigate(`${first.path}${search}`);
              }}
            />
          </div>
          <div ref={results} className="overflow-y-auto overscroll-contain p-2">
            <p role="status" className="sr-only">
              {STRINGS.results(found.length)}
            </p>
            {found.length > 0 ? (
              <PageList pages={found} search={search} />
            ) : (
              <p className="px-3 py-8 text-center text-muted">
                <bdi>{STRINGS.empty(query)}</bdi>
              </p>
            )}
          </div>
          <ul
            aria-hidden="true"
            className="flex flex-wrap gap-4 border-t border-separator px-4 py-2 text-xs text-muted"
          >
            {STRINGS.hints.map(([key, action]) => (
              <li key={action} className="flex items-center gap-1.5">
                <kbd dir="ltr" className="rounded-md border border-border px-1.5 font-mono">
                  {key}
                </kbd>
                {action}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </dialog>
  );
}
