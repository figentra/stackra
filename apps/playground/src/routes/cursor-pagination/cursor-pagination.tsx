/**
 * Stackra file contract:
 * Purpose: the page of the cursor pagination route: the pager with a first, a middle and a last page, an only page and
 *          a loading page; the load-more form with more, loading and the end; every size; the count with and without
 *          its own sentence; and two live examples over a fake cursor server (a pager that walks forward and back, and
 *          a list that grows), all from `@stackra/ui/react` with real props. There is no page number and no total
 *          anywhere: a cursor page has none.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. The fake server answers after a
 *          short delay so the loading state is seen; its timer is cleared on unmount. Every pagination on the page has
 *          its own `label`, so each navigation landmark is named once (axe `landmark-unique`).
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0313 (decision 4); ADR 0060
 *          (right-to-left); WCAG 2.2 SC 4.1.3.
 */
import { Size } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { PageSection } from "#src/components/page-section";
import { CursorPaginationRoute } from "#src/routes/cursor-pagination/cursor-pagination.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::cursor-pagination.*` keys.
const STRINGS = {
  documentTitle: `${CursorPaginationRoute.title} · Stackra Playground`,
  intro:
    "Cursor pagination moves through a list the server hands out in pages: it knows whether a next page exists (hasMore) and, from the app's own history, whether a previous one does. It never shows a page number or a total, because a cursor page has neither.",
  pager: "Pager",
  pagerNote:
    "Previous and next. Each is disabled when its page does not exist, and both while a page loads.",
  first: "First page",
  middle: "Middle page",
  last: "Last page",
  only: "Only page",
  loading: "Loading the next page",
  loadMore: "Load more",
  loadMoreNote:
    "One button that adds the next page to the list; it goes away when the server has no more.",
  more: "More to load",
  loadingMore: "Loading more",
  end: "End of the list",
  sizes: "Sizes",
  sizesNote: "The buttons take the same three sizes as Button.",
  size: (size: string) => `Size ${size}`,
  count: "Count",
  countNote:
    "The count of items shown, never a total. It is a polite status, so a screen reader hears it change. Its sentence is the caller's.",
  defaultCount: "Default sentence",
  customCount: "Custom sentence",
  customSentence: (count: number) => `${count} orders on this page`,
  live: "Try it",
  liveNote:
    "A fake server with 45 orders in pages of ten. The pager keeps the cursors it has left behind, which is how it knows a previous page exists; the list below it only grows.",
  pagerLabel: "Orders, paged",
  growingLabel: "Orders, growing",
  ordersPage: "Orders on this page",
  ordersGrowing: "Orders loaded so far",
  cursor: (cursor: number) => `Cursor: ${cursor}`,
  order: (number: number) => `Order ${number}`,
  pagerExample: "Walk forward and back",
  growingExample: "A list that grows",
} as const;

/** How many orders the fake server holds, and how many it hands out per page. */
const ORDER_COUNT = 45;
const PAGE_SIZE = 10;
/** How long the fake server takes to answer, so the loading state can be seen and tested. */
const LOAD_DELAY = 600;

/** The orders a fake server page holds from `cursor`, with the cursor of the page after it when there is one. */
function pageAt(cursor: number) {
  const end = Math.min(cursor + PAGE_SIZE, ORDER_COUNT);
  return {
    items: Array.from({ length: end - cursor }, (_, index) => STRINGS.order(1001 + cursor + index)),
    nextCursor: end < ORDER_COUNT ? end : undefined,
  };
}

/** A pager over the fake server: walks forward by the server's cursor and back by the cursors it kept. */
function PagerExample() {
  const [cursor, setCursor] = useState(0);
  const [history, setHistory] = useState<readonly number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const page = pageAt(cursor);

  const go = (to: number, kept: readonly number[]) => {
    setIsLoading(true);
    timer.current = window.setTimeout(() => {
      setCursor(to);
      setHistory(kept);
      setIsLoading(false);
    }, LOAD_DELAY);
  };

  return (
    <div className="grid gap-3">
      <ul aria-label={STRINGS.ordersPage} aria-busy={isLoading} className="grid gap-1">
        {page.items.map((order) => (
          <li key={order}>{order}</li>
        ))}
      </ul>
      <Ui.CursorPagination
        label={STRINGS.pagerLabel}
        hasMore={page.nextCursor !== undefined}
        hasPrevious={history.length > 0}
        isLoading={isLoading}
        count={page.items.length}
        onNext={() => {
          if (page.nextCursor !== undefined) go(page.nextCursor, [...history, cursor]);
        }}
        onPrevious={() => {
          const previous = history.at(-1);
          if (previous !== undefined) go(previous, history.slice(0, -1));
        }}
      />
      <Ui.Text tone="muted" data-testid="cursor">
        <bdi>{STRINGS.cursor(cursor)}</bdi>
      </Ui.Text>
    </div>
  );
}

/** A growing list over the fake server: each press adds the next page. */
function GrowingExample() {
  const [orders, setOrders] = useState<readonly string[]>(() => pageAt(0).items);
  const [nextCursor, setNextCursor] = useState<number | undefined>(() => pageAt(0).nextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const loadMore = () => {
    if (nextCursor === undefined) return;
    const from = nextCursor;
    setIsLoading(true);
    timer.current = window.setTimeout(() => {
      const page = pageAt(from);
      setOrders((shown) => [...shown, ...page.items]);
      setNextCursor(page.nextCursor);
      setIsLoading(false);
    }, LOAD_DELAY);
  };

  return (
    <div className="grid gap-3">
      <ul aria-label={STRINGS.ordersGrowing} aria-busy={isLoading} className="grid gap-1">
        {orders.map((order) => (
          <li key={order}>{order}</li>
        ))}
      </ul>
      <Ui.CursorPagination
        mode="load-more"
        label={STRINGS.growingLabel}
        hasMore={nextCursor !== undefined}
        isLoading={isLoading}
        count={orders.length}
        onNext={loadMore}
      />
    </div>
  );
}

/** A captioned sample: a small heading over what it shows. */
function Sample({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Ui.Heading level={3}>{title}</Ui.Heading>
      {children}
    </div>
  );
}

/** The CursorPagination page. */
export function CursorPagination() {
  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{CursorPaginationRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="cursor-pagination-pager" title={STRINGS.pager} note={STRINGS.pagerNote}>
        <Sample title={STRINGS.first}>
          <Ui.CursorPagination label={STRINGS.first} hasMore />
        </Sample>
        <Sample title={STRINGS.middle}>
          <Ui.CursorPagination label={STRINGS.middle} hasMore hasPrevious />
        </Sample>
        <Sample title={STRINGS.last}>
          <Ui.CursorPagination label={STRINGS.last} hasMore={false} hasPrevious />
        </Sample>
        <Sample title={STRINGS.only}>
          <Ui.CursorPagination label={STRINGS.only} hasMore={false} />
        </Sample>
        <Sample title={STRINGS.loading}>
          <Ui.CursorPagination label={STRINGS.loading} hasMore hasPrevious isLoading />
        </Sample>
      </PageSection>

      <PageSection id="cursor-pagination-more" title={STRINGS.loadMore} note={STRINGS.loadMoreNote}>
        <Sample title={STRINGS.more}>
          <Ui.CursorPagination mode="load-more" label={STRINGS.more} hasMore count={20} />
        </Sample>
        <Sample title={STRINGS.loadingMore}>
          <Ui.CursorPagination
            mode="load-more"
            label={STRINGS.loadingMore}
            hasMore
            isLoading
            count={20}
          />
        </Sample>
        <Sample title={STRINGS.end}>
          <Ui.CursorPagination mode="load-more" label={STRINGS.end} hasMore={false} count={45} />
        </Sample>
      </PageSection>

      <PageSection id="cursor-pagination-sizes" title={STRINGS.sizes} note={STRINGS.sizesNote}>
        {Size.map((size) => (
          <Sample key={size} title={STRINGS.size(size)}>
            <Ui.CursorPagination label={STRINGS.size(size)} size={size} hasMore hasPrevious />
          </Sample>
        ))}
      </PageSection>

      <PageSection id="cursor-pagination-count" title={STRINGS.count} note={STRINGS.countNote}>
        <Sample title={STRINGS.defaultCount}>
          <Ui.CursorPagination label={STRINGS.defaultCount} hasMore hasPrevious count={20} />
        </Sample>
        <Sample title={STRINGS.customCount}>
          <Ui.CursorPagination
            label={STRINGS.customCount}
            hasMore
            hasPrevious
            count={20}
            countLabel={STRINGS.customSentence}
          />
        </Sample>
      </PageSection>

      <PageSection id="cursor-pagination-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <Sample title={STRINGS.pagerExample}>
          <PagerExample />
        </Sample>
        <Sample title={STRINGS.growingExample}>
          <GrowingExample />
        </Sample>
      </PageSection>
    </article>
  );
}
