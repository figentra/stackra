/**
 * Stackra file contract:
 * Purpose: the native `SavedViews`: the saved views of a resource index as a single-choice tag row, the facet
 *          chips of one multi-select filter (label and count) as a multi-choice tag row, and a "Save view" button while
 *          the query matches no view. Choosing a view applies its query; a chip toggles its value in the facet filter.
 * Boundary: controlled by `query` and `onQueryChange`, like `FilterBar`; it stores nothing. The active view is the
 *           one whose query equals the current one (`activeViewIdOf`). Counts are the app's, formatted for the locale.
 * Runtime: react-native
 * Governing contract: ADR 0318; product audit 2026-10-28 (saved views and facet chips); WCAG 2.2 SC 4.1.2.
 */

import { View } from "react-native";
import type { ReactElement } from "react";

import { DATA_GRID_KEYS } from "#core/constants/data-grid-keys.constant";
import { activeViewIdOf } from "#core/functions/active-view-id-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import type { SavedViewsProps } from "#native/saved-views/saved-views.props";
import { TagGroup } from "#native/tag-group/tag-group";

/** The words. */
const K = DATA_GRID_KEYS.ui.data_table_tools;

/** Saved views and facet chips above a resource index. */
export function SavedViews({
  label,
  views,
  query,
  onQueryChange,
  facetFilterId,
  facets,
  facetLabel,
  onSaveView,
  className,
  ...rest
}: SavedViewsProps): ReactElement {
  const t = useUiText();
  const activeId = activeViewIdOf(views, query);
  const facetValue = facetFilterId ? query.filterValues[facetFilterId] : undefined;
  const picked = Array.isArray(facetValue) ? (facetValue as readonly string[]) : [];
  return (
    <View {...rest} className={["gap-3", className].filter(Boolean).join(" ")}>
      <TagGroup
        label={label}
        selectionMode="single"
        items={views.map((view) => ({ id: view.id, label: view.label }))}
        value={activeId ? [activeId] : []}
        onChange={(ids) => {
          const view = views.find((candidate) => candidate.id === ids[0]);
          if (view) onQueryChange(view.query);
        }}
      />
      {facetFilterId && facets && facets.length > 0 ? (
        <TagGroup
          label={facetLabel}
          selectionMode="multiple"
          items={facets.map((facet) => ({
            id: facet.id,
            label:
              facet.count === undefined
                ? facet.label
                : `${facet.label} (${facet.count.toLocaleString()})`,
          }))}
          value={picked}
          onChange={(ids) =>
            onQueryChange({
              ...query,
              filterValues: { ...query.filterValues, [facetFilterId]: ids },
            })
          }
        />
      ) : null}
      {onSaveView && activeId === undefined ? (
        <View>
          <Button variant="secondary" size="sm" startIcon="bookmark-plus" onPress={onSaveView}>
            {t(K.save_view)}
          </Button>
        </View>
      ) : null}
    </View>
  );
}
