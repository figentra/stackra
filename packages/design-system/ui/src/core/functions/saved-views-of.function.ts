/**
 * Stackra file contract:
 * Purpose: `savedViewsOf(props)`, what every runtime's SavedViews draws and reports: the view chips and the one that
 *          matches the query, the facet chips (each with its count when it has one) and the
 *          facets picked, and the queries a pick makes: a view's own query, or the query with the facet filter's
 *          picked values.
 * Boundary: pure; the runtimes draw the two tag groups and the save button. A pick of an unknown view changes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { SavedViewsContractProps } from "#contracts/types/saved-views-contract-props.type";
import { activeViewIdOf } from "#core/functions/active-view-id-of.function";

/** A chip of one of the two tag groups. */
interface SavedViewChip {
  readonly id: string;
  readonly label: string;
}

/**
 * The saved views' chips and picks.
 * @param props - the views, the query and its change handler, and the facet filter with its facets
 * @returns the active view, the view and facet chips, the facets picked and the two pick handlers
 */
export function savedViewsOf({
  views,
  query,
  onQueryChange,
  facetFilterId,
  facets,
}: Pick<
  SavedViewsContractProps,
  "views" | "query" | "onQueryChange" | "facetFilterId" | "facets"
>): {
  readonly activeId: string | undefined;
  readonly viewItems: readonly SavedViewChip[];
  readonly facetItems: readonly SavedViewChip[];
  readonly picked: readonly string[];
  readonly pickView: (ids: readonly string[]) => void;
  readonly pickFacets: (ids: readonly string[]) => void;
} {
  const facetValue = facetFilterId ? query.filterValues[facetFilterId] : undefined;
  return {
    activeId: activeViewIdOf(views, query),
    viewItems: views.map((view) => ({ id: view.id, label: view.label })),
    facetItems: (facets ?? []).map((facet) => ({
      id: facet.id,
      label:
        facet.count === undefined
          ? facet.label
          : `${facet.label} (${facet.count.toLocaleString()})`,
    })),
    picked: Array.isArray(facetValue) ? (facetValue as readonly string[]) : [],
    pickView: (ids) => {
      const view = views.find((candidate) => candidate.id === ids[0]);
      if (view) onQueryChange(view.query);
    },
    pickFacets: (ids) => {
      if (facetFilterId)
        onQueryChange({ ...query, filterValues: { ...query.filterValues, [facetFilterId]: ids } });
    },
  };
}
