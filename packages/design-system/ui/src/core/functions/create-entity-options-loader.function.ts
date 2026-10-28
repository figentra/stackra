/**
 * Stackra file contract:
 * Purpose: holds the records an EntityPicker lists and the three states of asking for them (idle, loading, failed), so
 *          the web and the native picker share one mechanism: the first search starts at once, later ones start after
 *          the user pauses typing, the next page is asked for with the cursor of the last, a response that a later
 *          request has replaced is dropped, and a failed next page keeps what was listed while a failed new search
 *          empties it.
 * Boundary: a plain store with no React in it, so core stays free of host libraries; each runtime's
 *           `useEntityOptions` reads it with `useSyncExternalStore`. Internal: not in the `.` barrel, `react/` and
 *           `native/` import it by path. The loader is read through a getter, so a picker that is given a new
 *           `loadOptions` on every render keeps one store.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0318 (wave 7 vocabulary, decision 2: cursor pages).
 */
import type { EntityOptionPage } from "#contracts/types/entity-option-page.type";
import type { EntityOptionsState } from "#core/types/entity-options-state.type";
import type { EntityOptionsLoader } from "#core/types/entity-options-loader.type";
import type { EntityOptionsLoaderOptions } from "#core/types/entity-options-loader-options.type";

const INITIAL: EntityOptionsState = Object.freeze({
  options: [],
  status: "idle",
  isLoadingMore: false,
  hasMore: false,
  hasAnswered: false,
});

/**
 * Creates the store of an EntityPicker's records.
 * @param options - how to read the picker's current `loadOptions` and pause
 * @returns the store; `search` starts it and the picker reads `getState`
 */
export function createEntityOptionsLoader(
  options: EntityOptionsLoaderOptions,
): EntityOptionsLoader {
  let state: EntityOptionsState = INITIAL;
  let requested: string | undefined;
  let cursor: string | undefined;
  // Each request takes the next number; an answer for any other number is stale and is dropped.
  let ticket = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();

  const change = (next: EntityOptionsState) => {
    state = next;
    for (const listener of listeners) listener();
  };

  const run = (text: string, after: string | undefined) => {
    const mine = ++ticket;
    const isMore = after !== undefined;
    change(isMore ? { ...state, isLoadingMore: true } : { ...state, status: "loading" });
    // A promise constructor, so a `loadOptions` that throws before it returns a promise is a rejection too.
    new Promise<EntityOptionPage>((resolve) => {
      resolve(options.getLoad()(text, after));
    }).then(
      (page) => {
        if (mine !== ticket) return;
        cursor = page.nextCursor ?? undefined;
        const known = new Set(isMore ? state.options.map((option) => option.id) : []);
        change({
          options: isMore
            ? [...state.options, ...page.items.filter((item) => !known.has(item.id))]
            : page.items,
          status: "idle",
          isLoadingMore: false,
          hasMore: cursor !== undefined,
          hasAnswered: true,
        });
      },
      () => {
        if (mine !== ticket) return;
        cursor = undefined;
        // A failed later page keeps what was listed; a failed new search lists nothing, since what is listed answered
        // a different text.
        change({
          ...state,
          options: isMore ? state.options : [],
          status: "error",
          isLoadingMore: false,
          hasMore: false,
          hasAnswered: true,
        });
      },
    );
  };

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    search: (text) => {
      // The same text again is the picker re-reading its own state, not a new search.
      if (text === requested && timer === undefined) return;
      clearTimeout(timer);
      timer = undefined;
      const isFirst = requested === undefined;
      requested = text;
      const start = () => {
        timer = undefined;
        run(text, undefined);
      };
      if (isFirst) start();
      else timer = setTimeout(start, options.getDebounceMs());
    },
    loadMore: () => {
      // A search waiting out its pause makes the cursor of the list on screen the wrong one to ask with.
      if (cursor === undefined || timer !== undefined) return;
      if (state.status === "loading" || state.isLoadingMore) return;
      run(requested ?? "", cursor);
    },
    dispose: () => {
      clearTimeout(timer);
      timer = undefined;
      ticket++;
      listeners.clear();
    },
  };
}
