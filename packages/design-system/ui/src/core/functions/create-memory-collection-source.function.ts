/**
 * Stackra file contract:
 * Purpose: `createMemoryCollectionSource()`, an in-memory driver of the `CollectionSource` port: it answers a
 *          `CollectionQuery` as a server would (search, rule tree, group first then the sort keys, then the page, the
 *          next `infinite` slice or the `cursor` page) after an optional delay, and resolves a `CollectionSelection` to
 *          ids (every match but the `except` ids). The playground's mock server and the engine's tests use it.
 * Boundary: pure data in memory; no network. A fetch whose signal fires rejects with the signal's reason and never
 *           answers. The cursor is the offset of the page as text.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29), wave 4 (server mode end to end, a mock adapter);
 *          STA-1371.
 */
import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { CollectionQuery } from "#contracts/types/collection-query.type";
import type { CollectionSource } from "#contracts/types/collection-source.type";
import { applyCollection } from "#core/functions/apply-collection.function";
import { defaultCollectionStateOf } from "#core/functions/default-collection-state-of.function";
import { resolveCollectionColumns } from "#core/functions/resolve-collection-columns.function";

/** Waits `ms`, or rejects at once when the signal fires. */
const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });

/**
 * A source over rows held in memory.
 * @param items - every row the "server" holds
 * @param columns - the columns, for the search and the filter's types
 * @param options - `latency` in milliseconds before each answer (0 by default) and the `locale` text sorts in
 * @returns the source a server-mode `useCollection` takes
 */
export function createMemoryCollectionSource<TItem extends CollectionItem>(
  items: readonly TItem[],
  columns: readonly CollectionColumn[],
  options: { readonly latency?: number; readonly locale?: string } = {},
): CollectionSource<TItem> {
  const { latency = 0, locale = "en" } = options;
  const resolved = resolveCollectionColumns(columns, []);
  const matchedOf = (query: Pick<CollectionQuery, "search" | "filter" | "sort" | "groupBy">) => {
    const state = {
      ...defaultCollectionStateOf(columns),
      search: query.search,
      filter: query.filter,
      // Grouped rows come group by group, so a page never splits a heading from its rows needlessly.
      sort: query.groupBy
        ? [
            { column: query.groupBy, direction: "ascending" as const },
            ...query.sort.filter((key) => key.column !== query.groupBy),
          ]
        : query.sort,
    };
    return applyCollection(items, state, resolved, "none", locale).matched;
  };
  return {
    fetch: async (query, signal) => {
      await delay(latency, signal);
      const matched = matchedOf(query);
      const size = Math.max(1, query.pageSize);
      const start =
        query.paging === "cursor"
          ? Number(query.cursor ?? 0)
          : query.paging === "none"
            ? 0
            : query.page * size;
      const end = query.paging === "none" ? matched.length : start + size;
      return {
        items: matched.slice(start, end),
        totalCount: matched.length,
        nextCursor: end < matched.length ? String(end) : null,
      };
    },
    resolve: async (selection, signal) => {
      await delay(latency, signal);
      if (selection.kind === "ids") return selection.ids;
      return matchedOf({ ...selection, sort: [], groupBy: null })
        .map((item) => item.id)
        .filter((id) => !selection.except.includes(id));
    },
  };
}
