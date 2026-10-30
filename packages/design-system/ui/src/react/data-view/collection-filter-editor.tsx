/**
 * Stackra file contract:
 * Purpose: the web `CollectionFilterEditor`, the and/or rule tree of a collection: a `RuleBuilder` for the top level
 *          ("all" or "any" of these), a `RuleBuilder` per nested group (each one more condition of the top level) with a
 *          button that removes it, "Add a group", and "Clear filters".
 * Boundary: every edit sets the engine's filter, which applies at once (back on the first page). The fields are the
 *           filterable columns by their shown names.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); WCAG 2.2 SC 1.3.1, 2.4.6.
 */
import type { ReactElement } from "react";

import type { CollectionFilter } from "#contracts/types/collection-filter.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import { COLLECTION_KEYS } from "#core/constants/collection-keys.constant";
import { collectionRuleFieldsOf } from "#core/functions/collection-rule-fields-of.function";
import { filterConditionCountOf } from "#core/functions/filter-condition-count-of.function";
import { Button } from "#react/button/button";
import type { CollectionFilterEditorProps } from "#react/data-view/collection-filter-editor.props";
import { useUiText } from "#react/hooks/use-ui-text";
import { RuleBuilder } from "#react/rule-builder/rule-builder";

/** The words. */
const K = COLLECTION_KEYS.ui.collection;

/** The empty tree. */
const EMPTY: CollectionFilter = { match: "all", conditions: [] };

/** Edits a collection's rule tree. */
export function CollectionFilterEditor<TItem extends CollectionItem = CollectionItem>({
  collection,
  label,
}: CollectionFilterEditorProps<TItem>): ReactElement {
  const t = useUiText();
  const fields = collectionRuleFieldsOf(collection.columns);
  const filter = collection.state.filter;
  const groups = filter.groups ?? [];
  const setGroups = (next: readonly CollectionFilter[]) =>
    collection.setFilter({ ...filter, groups: next });
  return (
    <div className="grid gap-4" data-slot="collection-filter-editor">
      <RuleBuilder
        label={t(K.filter_title, { label })}
        fields={fields}
        value={filter}
        onChange={(top) => collection.setFilter({ ...top, groups })}
      />
      {groups.map((group, index) => (
        <section
          key={group.id ?? index}
          aria-label={t(K.group_match, { index: index + 1 })}
          className="grid gap-2 border-s-2 border-accent ps-3"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="m-0 text-sm font-medium">{t(K.group_match, { index: index + 1 })}</h3>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => setGroups(groups.filter((_, at) => at !== index))}
            >
              {t(K.remove_group)}
            </Button>
          </div>
          <RuleBuilder
            label={t(K.group_match, { index: index + 1 })}
            fields={fields}
            value={group}
            onChange={(next) =>
              setGroups(groups.map((entry, at) => (at === index ? { ...entry, ...next } : entry)))
            }
          />
        </section>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          startIcon="plus"
          onPress={() =>
            setGroups([
              ...groups,
              { id: `g${Date.now().toString(36)}`, match: "any", conditions: [] },
            ])
          }
        >
          {t(K.add_group)}
        </Button>
        {filterConditionCountOf(filter) > 0 ? (
          <Button variant="ghost" size="sm" onPress={() => collection.setFilter(EMPTY)}>
            {t(K.clear_filters)}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
