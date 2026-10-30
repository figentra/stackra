/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Cursor pagination: A fake server with 45 orders in pages of ten. The pager
 *          keeps the cursors it has left behind, which is how it knows a previous page exists; the list below it only
 *          grows.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313 (decision 4); ADR 0060 (right-to-left); WCAG 2.2 SC 4.1.3.
 */
import {
  CursorPagination as UiCursorPagination,
  Heading,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CURSOR_PAGINATION_KEYS } from "#src/demos/free/cursor-pagination/cursor-pagination-keys.constant";

/** The demo's keys. */
const K = CURSOR_PAGINATION_KEYS.cursor_pagination;

/** How many orders the fake server holds, and how many it hands out per page. */
const ORDER_COUNT = 45;

const PAGE_SIZE = 10;

/** How long the fake server takes to answer, so the loading state can be seen and tested. */
const LOAD_DELAY = 600;

/** The orders a fake server page holds from `cursor`, with the cursor of the page after it when there is one. */
function pageAt(t: ReturnType<typeof useCatalogueText>, cursor: number) {
  const end = Math.min(cursor + PAGE_SIZE, ORDER_COUNT);
  return {
    items: Array.from({ length: end - cursor }, (_, index) =>
      t(K.order, { number: 1001 + cursor + index }),
    ),
    nextCursor: end < ORDER_COUNT ? end : undefined,
  };
}

/** A pager over the fake server: walks forward by the server's cursor and back by the cursors it kept. */
function PagerExample() {
  const t = useCatalogueText(MESSAGES.en);

  const [cursor, setCursor] = useState(0);
  const [history, setHistory] = useState<readonly number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const page = pageAt(t, cursor);

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
      <ul aria-label={t(K.orders_page)} aria-busy={isLoading} className="grid gap-1">
        {page.items.map((order) => (
          <li key={order}>{order}</li>
        ))}
      </ul>
      <UiCursorPagination
        label={t(K.pager_label)}
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
      <Text tone="muted" data-testid="cursor">
        <bdi>{t(K.cursor, { cursor })}</bdi>
      </Text>
    </div>
  );
}

/** A growing list over the fake server: each press adds the next page. */
function GrowingExample() {
  const t = useCatalogueText(MESSAGES.en);

  const [orders, setOrders] = useState<readonly string[]>(() => pageAt(t, 0).items);
  const [nextCursor, setNextCursor] = useState<number | undefined>(() => pageAt(t, 0).nextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const loadMore = () => {
    if (nextCursor === undefined) return;
    const from = nextCursor;
    setIsLoading(true);
    timer.current = window.setTimeout(() => {
      const page = pageAt(t, from);
      setOrders((shown) => [...shown, ...page.items]);
      setNextCursor(page.nextCursor);
      setIsLoading(false);
    }, LOAD_DELAY);
  };

  return (
    <div className="grid gap-3">
      <ul aria-label={t(K.orders_growing)} aria-busy={isLoading} className="grid gap-1">
        {orders.map((order) => (
          <li key={order}>{order}</li>
        ))}
      </ul>
      <UiCursorPagination
        mode="load-more"
        label={t(K.growing_label)}
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
      <Heading level={3}>{title}</Heading>
      {children}
    </div>
  );
}

/** Cursor pagination: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-6">
      <Sample title={t(K.pager_example)}>
        <PagerExample />
      </Sample>
      <Sample title={t(K.growing_example)}>
        <GrowingExample />
      </Sample>
    </div>
  );
}
