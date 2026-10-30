/**
 * Stackra file contract:
 * Purpose: `pageContextOf(listState, record, selection)`, what a panel page publishes as AI page context: the record id,
 *          the selected row ids (at most 200, with the full count) and the list's applied filters.
 * Boundary: pure and structural: it returns a `PanelPageContext` and imports no AI package. Ids and filter keys only
 *           (ADR 0490 decision 5): a filter value that is not text, a number, a flag or a short list of text is left
 *           out, and an empty one too. The search text travels as the filter `search`. The server resolves the context
 *           under the caller's permissions; nothing here proves a record readable.
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decisions 5 and 6); ADR 0307 (rule 11: the list state); STA-1631.
 */
import type { PanelPageContext } from "#core/types/panel-page-context.type";
import type { ResourceListState } from "#core/types/resource-list-state.type";

/** The most selected ids a page context carries. */
const MAX_SELECTED_IDS = 200;

/** The value as a published filter, or undefined when it is empty or not a plain value. */
function published(value: unknown): string | number | boolean | readonly string[] | undefined {
  if (typeof value === "string") return value === "" ? undefined : value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string"))
    return value as readonly string[];
  return undefined;
}

/**
 * The page context of a panel page.
 *
 * @param listState - the list's search and applied filters; absent on a page with no list.
 * @param record - the public id of the record the page shows; absent on a list page.
 * @param selection - the public ids of the selected rows; absent or empty for none.
 * @example
 * pageContextOf({ search: "", filters: { status: "open" } }, undefined, ids);
 * // { selection: { ids, count: ids.length }, filters: { status: "open" } }
 */
export function pageContextOf(
  listState: Pick<ResourceListState, "search" | "filters"> | undefined,
  record: string | undefined,
  selection: readonly string[] | undefined,
): PanelPageContext {
  const raw: (readonly [string, unknown])[] = [
    ...(listState === undefined || listState.search === ""
      ? []
      : [["search", listState.search] as const]),
    ...Object.entries(listState?.filters ?? {}),
  ];
  const entries = raw.flatMap(([key, value]) => {
    const kept = published(value);
    return kept === undefined ? [] : [[key, kept] as const];
  });
  return {
    ...(record === undefined ? {} : { record }),
    ...(selection === undefined || selection.length === 0
      ? {}
      : { selection: { ids: selection.slice(0, MAX_SELECTED_IDS), count: selection.length } }),
    ...(entries.length === 0 ? {} : { filters: Object.fromEntries(entries) }),
  };
}
