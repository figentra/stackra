/**
 * Stackra file contract:
 * Purpose: the web `SavedViews`: the saved views of a resource index as a single-choice tag row, the facet
 *          chips of one multi-select filter (label and count) as a multi-choice tag row, and a "Save view" button while
 *          the query matches no view. Choosing a view applies its query; a chip toggles its value in the facet filter.
 * Boundary: controlled by `query` and `onQueryChange`, like `FilterBar`; it stores nothing. The active view is the
 *           one whose query equals the current one (`activeViewIdOf`). Counts are the app's, formatted for the locale.
 * Runtime: browser
 * Governing contract: ADR 0318; product audit 2026-10-28 (saved views and facet chips); WCAG 2.2 SC 4.1.2.
 */
import type { ReactElement } from "react";
import { cn } from "@heroui/react";

import { DATA_GRID_KEYS } from "#core/constants/data-grid-keys.constant";
import { savedViewsOf } from "#core/functions/saved-views-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#react/button/button";
import type { SavedViewsProps } from "#react/saved-views/saved-views.props";
import { TagGroup } from "#react/tag-group/tag-group";

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
  const { activeId, viewItems, facetItems, picked, pickView, pickFacets } = savedViewsOf({
    views,
    query,
    onQueryChange,
    facetFilterId,
    facets,
  });
  return (
    <div {...rest} className={cn("grid gap-3", className)}>
      <TagGroup
        label={label}
        selectionMode="single"
        items={viewItems}
        value={activeId ? [activeId] : []}
        onChange={pickView}
      />
      {facetFilterId && facets && facets.length > 0 ? (
        <TagGroup
          label={facetLabel}
          selectionMode="multiple"
          items={facetItems}
          value={picked}
          onChange={pickFacets}
        />
      ) : null}
      {onSaveView && activeId === undefined ? (
        <div>
          <Button variant="secondary" size="sm" startIcon="bookmark-plus" onPress={onSaveView}>
            {t(K.save_view)}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
