/**
 * Stackra file contract:
 * Purpose: the page navigation of a component page, in place of a long sidebar: a glass strip with a link back to
 *          every component and the pages of the current page's category as pills, the current one marked
 *          (`aria-current="page"`, the accent fill and a dot). It scrolls sideways on a narrow screen; every other
 *          page is one search away (the command palette).
 * Boundary: links only; every link keeps the URL's search params so the scheme and direction carry over.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); WCAG 2.2 SC 2.4.8, 1.4.1.
 */
import * as Ui from "@stackra/ui/react";
import { useEffect, useRef } from "react";

import type { PageLink } from "#src/types/page-link.type";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::category-nav.*` keys.
const STRINGS = { pages: "Pages", all: "All components" } as const;

/** Props of {@link CategoryNav}. */
export interface CategoryNavProps {
  /** Every page, in navigation order. */
  pages: readonly PageLink[];
  /** The page on screen. */
  current: PageLink;
  /** The URL search params each link keeps. */
  search: string;
}

const PILL =
  "inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm whitespace-nowrap hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/** The category strip of a component page. */
export function CategoryNav({ pages, current, search }: CategoryNavProps) {
  const siblings = pages.filter((page) => page.category === current.category);
  // On a narrow screen the strip scrolls; the current page is brought into it.
  const strip = useRef<HTMLElement>(null);
  useEffect(() => {
    strip.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [current.path]);
  return (
    <nav
      ref={strip}
      aria-label={STRINGS.pages}
      className="material-thick flex items-center gap-2 overflow-x-auto rounded-2xl p-1.5 [scrollbar-width:none]"
    >
      <Ui.Link
        href={`/${search}#components`}
        underline="hover"
        className={`${PILL} text-muted hover:bg-default`}
      >
        <Ui.Icon name="layout-grid" size="sm" />
        {STRINGS.all}
      </Ui.Link>
      <span aria-hidden="true" className="h-5 w-px shrink-0 bg-separator" />
      <p className="shrink-0 px-2 text-xs font-semibold tracking-wide text-muted">
        {current.category}
      </p>
      <ul aria-label={current.category} className="flex gap-1">
        {siblings.map((page) => {
          const isCurrent = page.path === current.path;
          return (
            <li key={page.path}>
              <Ui.Link
                href={`${page.path}${search}`}
                underline="hover"
                {...(isCurrent ? { "aria-current": "page" as const } : {})}
                className={`${PILL} ${isCurrent ? "bg-accent text-accent-foreground!" : "hover:bg-default"}`}
              >
                {isCurrent ? (
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                ) : null}
                {page.title}
              </Ui.Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
