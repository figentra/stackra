/**
 * Stackra file contract:
 * Purpose: `TamoFilterAsk`, ask-to-filter on a `useCollection` engine: the person says what they want ("paid orders
 *          over 500, newest first"), Tamo proposes conditions and sort keys, drawn as dashed proposed chips, and Apply
 *          puts them on the engine (a proposed condition replaces the one with its id; the sort replaces the sort).
 * Boundary: internal to FilterBar and the collection tools. Tamo is told the filterable columns' ids, labels, kinds and
 *           choices, never a row (ADR 0490 decision 6); nothing changes until Apply (ADR 0021).
 * Runtime: browser
 * Governing contract: ADR 0507 (FilterBar ask in words: proposed chips); ADR 0505 (one filter model).
 */
import type { ReactElement } from "react";
import { useLocale } from "react-aria-components";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { TamoTasks } from "#contracts/types/tamo-tasks.type";
import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { conditionChipTextOf } from "#core/functions/condition-chip-text-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { TamoAskBox } from "#react/tamo-ask-box/tamo-ask-box";
import type { TamoFilterAskProps } from "#react/filter-bar/tamo-filter-ask.props";

/** K: the Tamo words. */
const K = TAMO_KEYS.ui.tamo;

/** Ask Tamo to filter and sort a collection. */
export function TamoFilterAsk<TItem extends CollectionItem = CollectionItem>({
  slot,
  collection,
  onDone,
}: TamoFilterAskProps<TItem>): ReactElement {
  const t = useUiText();
  const { locale } = useLocale();
  const columns = collection.columns
    .filter((column) => column.isFilterable !== false)
    .map((column) => ({
      id: column.id,
      label: column.label,
      type: column.type,
      options: column.options?.map((option) => option.id),
    }));
  const labelOf = (id: string) =>
    collection.columns.find((column) => column.id === id)?.label ?? id;
  return (
    <TamoAskBox<TamoTasks["filter"]["output"]>
      label={t(K.ask_filter)}
      placeholder={t(K.filter_placeholder)}
      isAutoFocus
      onAsk={async (text, signal) => {
        const proposal = await slot.run("filter", { text, locale, columns }, signal);
        return proposal.conditions.length + proposal.sort.length === 0 ? null : proposal;
      }}
      renderProposal={(proposal) => (
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {proposal.conditions.map((condition) => (
            <li
              key={condition.id}
              className="rounded-[var(--radius-pill)] border border-dashed border-[var(--tamo-glow-mid)] px-2.5 py-0.5 text-sm"
            >
              {conditionChipTextOf(condition, collection.columns, (operator) =>
                t(UI_KEYS.ui.rule_operator[operator]),
              )}
            </li>
          ))}
          {proposal.sort.map((sort) => (
            <li
              key={`sort:${sort.column}`}
              className="rounded-[var(--radius-pill)] border border-dashed border-[var(--tamo-glow-mid)] px-2.5 py-0.5 text-sm"
            >
              {t(K.sort_by, {
                label: labelOf(sort.column),
                direction: t(sort.direction === "descending" ? K.descending : K.ascending),
              })}
            </li>
          ))}
        </ul>
      )}
      onApply={(proposal) => {
        const ids = new Set(proposal.conditions.map((condition) => condition.id));
        const filter = collection.state.filter;
        collection.setFilter({
          ...filter,
          conditions: [
            ...filter.conditions.filter((condition) => !ids.has(condition.id)),
            ...proposal.conditions,
          ],
        });
        if (proposal.sort.length > 0) collection.setSort(proposal.sort);
        onDone?.();
      }}
      onDiscard={onDone}
    />
  );
}
