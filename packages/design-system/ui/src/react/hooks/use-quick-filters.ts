/**
 * Stackra file contract:
 * Purpose: `useQuickFilters(collection)`, what every runtime's FilterBar and FilterPanel read and change on a
 *          `useCollection` engine: the quick filters derived from its columns, each one's value and whether it is
 *          applied, the other conditions and nested groups of its filter as read-only chips, and clear-all.
 * Boundary: plain React (no DOM, no React Native), so both runtimes share it; it keeps no state. A quick filter is one
 *           top-level condition (`quickFilterIdOf`); any other condition (the advanced editor's) is shown, not edited.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0505 (one filter model); STA-1371.
 */
import type { RuleOperator } from "#contracts/enums/rule-operator.enum";
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import type { FilterValue } from "#contracts/types/filter-value.type";
import { COLLECTION_KEYS } from "#core/constants/collection-keys.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { collectionFilterWith } from "#core/functions/collection-filter-with.function";
import { conditionChipTextOf } from "#core/functions/condition-chip-text-of.function";
import { filterDefinitionsOf } from "#core/functions/filter-definitions-of.function";
import { filterValueOf } from "#core/functions/filter-value-of.function";
import { isFilterValueEmpty } from "#core/functions/is-filter-value-empty.function";
import { quickFilterIdOf } from "#core/functions/quick-filter-id-of.function";
import { useUiText } from "#react/hooks/use-ui-text";

/** A condition or group of the filter that is not a quick filter: its text and how to remove it. */
interface OtherChip {
  readonly id: string;
  readonly text: string;
  readonly remove: () => void;
}

/**
 * The quick filters of an engine.
 * @param collection - the engine
 * @returns the filters, their values, the applied ids, the other chips, and the changes
 */
export function useQuickFilters<TItem extends CollectionItem>(
  collection: CollectionController<TItem>,
): {
  readonly definitions: readonly FilterDefinition[];
  readonly definitionOf: (id: string) => FilterDefinition | undefined;
  readonly valueOf: (id: string) => FilterValue | undefined;
  readonly appliedIds: readonly string[];
  readonly others: readonly OtherChip[];
  readonly setValue: (id: string, value: FilterValue | undefined) => void;
  readonly clearAll: () => void;
} {
  const t = useUiText();
  const { filter } = collection.state;
  const definitions = filterDefinitionsOf(collection.columns);
  const definitionOf = (id: string) => definitions.find((definition) => definition.id === id);
  const valueOf = (id: string) => {
    const definition = definitionOf(id);
    return definition ? filterValueOf(filter, definition) : undefined;
  };
  const appliedIds = definitions
    .filter((definition) => {
      const value = filterValueOf(filter, definition);
      return value !== undefined && !isFilterValueEmpty(value);
    })
    .map((definition) => definition.id);
  const quickIds = new Set(appliedIds.map(quickFilterIdOf));
  const operatorWord = (operator: RuleOperator) => t(UI_KEYS.ui.rule_operator[operator]);
  const others: OtherChip[] = [
    ...filter.conditions
      .filter((condition) => !quickIds.has(condition.id))
      .map((condition) => ({
        id: condition.id,
        text: conditionChipTextOf(condition, collection.columns, operatorWord),
        remove: () =>
          collection.setFilter({
            ...collection.state.filter,
            conditions: collection.state.filter.conditions.filter(
              (entry) => entry.id !== condition.id,
            ),
          }),
      })),
    ...(filter.groups ?? []).map((group, index) => ({
      id: group.id ?? `group-${index}`,
      text: `${t(COLLECTION_KEYS.ui.collection.group_match, { index: index + 1 })} (${group.conditions.length})`,
      remove: () =>
        collection.setFilter({
          ...collection.state.filter,
          groups: (collection.state.filter.groups ?? []).filter((_, at) => at !== index),
        }),
    })),
  ];
  return {
    definitions,
    definitionOf,
    valueOf,
    appliedIds,
    others,
    setValue: (id, value) => {
      const definition = definitionOf(id);
      if (definition)
        collection.setFilter(collectionFilterWith(collection.state.filter, definition, value));
    },
    clearAll: () => {
      collection.setSearch("");
      collection.setFilter({ match: "all", conditions: [] });
    },
  };
}
