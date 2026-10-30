/**
 * Stackra file contract:
 * Purpose: the "live-more" demo of the web List: Scroll the box to its end; the list reports it and the page adds
 *          five rows after a short wait, up to fifteen.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0313; ADR 0060 (light, dark, RTL).
 */
import { List as UiList, Text, useCatalogueText } from "@stackra/ui/react";
import { useEffect, useRef, useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { LIST_KEYS } from "#src/demos/free/list/list-keys.constant";

/** The demo's keys. */
const K = LIST_KEYS.list;

/** The activity rows, five at a time. */
const activityRows = (t: ReturnType<typeof useCatalogueText>, count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `activity-${index + 1}`,
    title: `Activity ${index + 1}`,
    description: t(K.sample.a_moment_ago),
  }));

/** How many rows one page of activity holds, and how many there are in all. */
const PAGE = 5;

const TOTAL = 15;

/** List: Try loading more. */
export default function LiveMore() {
  const t = useCatalogueText(MESSAGES.en);

  const [activity, setActivity] = useState(PAGE);

  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // A pending load is dropped with the page, so it cannot set state after the page is gone.
  useEffect(() => () => clearTimeout(timer.current), []);

  const loadMore = () => {
    setIsLoadingMore(true);
    timer.current = setTimeout(() => {
      setActivity((count) => Math.min(count + PAGE, TOTAL));
      setIsLoadingMore(false);
    }, 400);
  };

  return (
    <div className="grid gap-6">
      {/* A scrollable box must take focus, so a keyboard user can scroll it (WCAG 2.1.1). */}
      <div
        role="region"
        aria-label={t(K.scroll_region)}
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- reason: a scroll region must take focus so a keyboard user can scroll it (WCAG 2.1.1)
        tabIndex={0}
        className="h-56 overflow-y-auto"
        data-testid="list-scroll"
      >
        <UiList
          label={t(K.live_more_label)}
          items={activityRows(t, activity)}
          hasMore={activity < TOTAL}
          onLoadMore={loadMore}
          isLoading={isLoadingMore}
          loadingLabel={t(K.loading)}
        />
      </div>
      <Text role="status" tone="muted" data-testid="list-count">
        {t(K.rows, { count: activity })}
      </Text>
    </div>
  );
}
