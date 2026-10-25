/**
 * Stackra file contract:
 * Purpose: the previous and next links at the foot of a component page, in navigation order across every category,
 *          as two glass cards: so a reviewer walks the whole system without going back to the index.
 * Boundary: links only; each keeps the URL's search params. The first page has no previous, the last no next.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); WCAG 2.2 SC 2.4.8.
 */
import * as Ui from "@stackra/ui/react";

import type { PageLink } from "#src/types/page-link.type";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::page-pager.*` keys.
const STRINGS = { label: "Previous and next page", previous: "Previous", next: "Next" } as const;

/** Props of {@link PagePager}. */
export interface PagePagerProps {
  /** Every page, in navigation order. */
  pages: readonly PageLink[];
  /** The page on screen. */
  current: PageLink;
  /** The URL search params each link keeps. */
  search: string;
}

const CARD =
  "material-thick lift grid min-h-16 w-full gap-0.5 rounded-2xl px-4 py-3 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/** The previous and next page links. */
export function PagePager({ pages, current, search }: PagePagerProps) {
  const at = pages.findIndex((page) => page.path === current.path);
  const previous = at > 0 ? pages[at - 1] : undefined;
  const next = at >= 0 ? pages[at + 1] : undefined;
  return (
    <nav aria-label={STRINGS.label} className="grid gap-3 sm:grid-cols-2">
      {previous ? (
        <Ui.Link href={`${previous.path}${search}`} underline="hover" className={CARD}>
          <span className="flex items-center gap-1 text-xs text-muted">
            <Ui.Icon name="arrow-left" size="sm" isMirroredInRtl />
            {STRINGS.previous}
          </span>
          <span className="font-semibold">{previous.title}</span>
        </Ui.Link>
      ) : (
        <span />
      )}
      {next ? (
        <Ui.Link
          href={`${next.path}${search}`}
          underline="hover"
          className={`${CARD} justify-items-end text-end`}
        >
          <span className="flex items-center gap-1 text-xs text-muted">
            {STRINGS.next}
            <Ui.Icon name="arrow-right" size="sm" isMirroredInRtl />
          </span>
          <span className="font-semibold">{next.title}</span>
        </Ui.Link>
      ) : null}
    </nav>
  );
}
