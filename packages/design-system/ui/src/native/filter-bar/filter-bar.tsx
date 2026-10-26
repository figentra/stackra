/**
 * Stackra file contract:
 * Purpose: the native `FilterBar`, the adapted form of ADR 0302 (decision 3) and ADR 0318 (decision 10), on the web
 *          one's contract. A phone has no room for a popover beside every chip, so the bar is a `SearchField` over one
 *          horizontal row (an add-filter button, one chip per applied filter, and clear-all while the query narrows),
 *          and every editor opens in one inset `Drawer`: the "add filter" press opens it on the list of filters not yet
 *          applied, choosing one swaps the same sheet to that filter's editor, and a chip opens it on its own editor.
 *          A chip is a button that opens its editor and a close button that removes the filter. Every other `View` prop
 *          passes through to the root.
 * Boundary: it holds no query: each change calls `onQueryChange` with the whole next query, and only the sheet's own
 *           state (closed, adding, or editing one filter) lives here. The sort is handed through untouched. A filter
 *           whose value filters nothing has no chip once its sheet closes (ADR 0318 decision 3). The sheet is the
 *           Drawer of wave 4, so it is HeroUI Native's inset style by the owner's decision of 2026-10-24, and it is never
 *           stacked on another sheet: "add" and "edit" are two contents of one. Strings are always wrapped in `Text`,
 *           which React Native requires. Native has no focus to move after a chip goes. The words are defaults
 *           from the `ui` catalogue in the active locale. Builds on earlier waves and, through `FilterEditor`, on NumberField and DateField, leaf
 *           groups of this wave (ADR 0318 decision 4). Needs the native `DesignSystemProvider`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318 (decisions 1 to 4 and 10); ADR 0165 (HeroUI
 *          Native on native); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.5.8, 4.1.2; owner decision 6 of STA-350
 *          (thin wrappers).
 */
import { useState, type ReactElement } from "react";
import { ScrollView, View, type ViewProps } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#core/hooks/use-ui-text";
import type { FilterBarContractProps } from "#contracts/types/filter-bar-contract-props.type";
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import type { FilterValue } from "#contracts/types/filter-value.type";
import { clearResourceQueryFilters } from "#core/functions/clear-resource-query-filters.function";
import { filterChipTextOf } from "#core/functions/filter-chip-text-of.function";
import { filterChipWordsOf } from "#core/functions/filter-chip-words-of.function";
import { isFilterValueEmpty } from "#core/functions/is-filter-value-empty.function";
import { isResourceQueryFiltered } from "#core/functions/is-resource-query-filtered.function";
import { queryWithFilter } from "#core/functions/query-with-filter.function";
import { Button } from "#native/button/button";
import { CloseButton } from "#native/close-button/close-button";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { Drawer } from "#native/drawer/drawer";
import { FilterEditor } from "#native/filter-bar/filter-editor";
import { SearchField } from "#native/search-field/search-field";
import { Text } from "#native/text/text";

/**
 * Props of the native FilterBar: the shared contract plus the props of a `View`, passed through to the root. The bar
 * draws its own content, so children are refused.
 */
export type FilterBarProps = FilterBarContractProps &
  Omit<ViewProps, keyof FilterBarContractProps | "children">;

/** What the sheet shows: nothing (closed), the list of filters to add, or the editor of one filter. */
type Sheet = { readonly mode: "add" } | { readonly mode: "edit"; readonly id: string } | null;

/** The hit area added around a small button, so a touch target is at least 24 points (WCAG 2.5.8). */
const HIT_SLOP = 8;

/**
 * The search and filters of a resource index, for a phone. Controlled: pass the `query` and take the next one from
 * `onQueryChange`. Put it in the `filterBar` slot of a `DataTable` with the same query.
 */
export function FilterBar({
  query,
  onQueryChange,
  filters,
  searchLabel,
  searchPlaceholder,
  accessibilityLabel,
  ...rest
}: FilterBarProps): ReactElement {
  const t = useUiText();
  const { locale } = useDesignSystem();
  const [sheet, setSheet] = useState<Sheet>(null);

  const definitionOf = (id: string) => filters.find((filter) => filter.id === id);
  const appliedIds = Object.entries(query.filterValues)
    .filter(([id, value]) => definitionOf(id) !== undefined && !isFilterValueEmpty(value))
    .map(([id]) => id);
  const editingId = sheet?.mode === "edit" ? sheet.id : null;
  // The filter whose editor is open has a chip even while it filters nothing; it goes after the applied ones.
  const chipIds =
    editingId !== null && definitionOf(editingId) !== undefined && !appliedIds.includes(editingId)
      ? [...appliedIds, editingId]
      : appliedIds;
  const addable = filters.filter((filter) => !chipIds.includes(filter.id));
  const editing = editingId === null ? undefined : definitionOf(editingId);

  const setFilter = (id: string, value: FilterValue | undefined) =>
    onQueryChange(queryWithFilter(query, id, value));
  const close = () => setSheet(null);

  const renderChip = (definition: FilterDefinition) => {
    const summary = filterChipTextOf(
      definition,
      query.filterValues[definition.id],
      locale,
      filterChipWordsOf(t),
    );
    return (
      <View key={definition.id} className="flex-row items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          endIcon="chevron-down"
          onPress={() => setSheet({ mode: "edit", id: definition.id })}
        >
          {summary === "" ? definition.label : `${definition.label}: ${summary}`}
        </Button>
        <CloseButton
          label={t(UI_KEYS.ui.filter_bar.remove, { label: definition.label })}
          hitSlop={HIT_SLOP}
          onPress={() => {
            setFilter(definition.id, undefined);
            setSheet((current) =>
              current?.mode === "edit" && current.id === definition.id ? null : current,
            );
          }}
        />
      </View>
    );
  };

  return (
    <View
      {...rest}
      accessibilityRole="search"
      accessibilityLabel={
        accessibilityLabel ?? t(UI_KEYS.ui.filter_bar.landmark, { label: searchLabel })
      }
      className={["gap-2", rest.className].filter(Boolean).join(" ")}
    >
      <SearchField
        accessibilityLabel={searchLabel}
        clearLabel={t(UI_KEYS.ui.filter_bar.clear_search)}
        value={query.search}
        onChange={(search) => onQueryChange({ ...query, search })}
        {...(searchPlaceholder === undefined ? {} : { placeholder: searchPlaceholder })}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="items-center gap-2"
      >
        <Button
          variant="outline"
          size="sm"
          startIcon="plus"
          isDisabled={addable.length === 0}
          onPress={() => setSheet({ mode: "add" })}
        >
          {t(UI_KEYS.ui.filter_bar.add)}
        </Button>
        {chipIds.map((id) => {
          const definition = definitionOf(id);
          return definition === undefined ? null : renderChip(definition);
        })}
        {isResourceQueryFiltered(query) ? (
          <Button
            variant="ghost"
            size="sm"
            onPress={() => {
              close();
              onQueryChange(clearResourceQueryFilters(query));
            }}
          >
            {t(UI_KEYS.ui.filter_bar.clear_all)}
          </Button>
        ) : null}
      </ScrollView>
      <Drawer
        isOpen={sheet !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) close();
        }}
        label={editing?.label ?? t(UI_KEYS.ui.filter_bar.add)}
      >
        <Drawer.Header>
          <Drawer.Title>{editing?.label ?? t(UI_KEYS.ui.filter_bar.add)}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          {editing === undefined ? (
            addable.length === 0 ? (
              <Text tone="muted">{t(UI_KEYS.ui.filter_bar.all_applied)}</Text>
            ) : (
              addable.map((filter) => (
                <Button
                  key={filter.id}
                  variant="tertiary"
                  isFullWidth
                  isDisabled={filter.isDisabled ?? false}
                  onPress={() => setSheet({ mode: "edit", id: filter.id })}
                  {...(filter.icon === undefined ? {} : { startIcon: filter.icon })}
                >
                  {filter.label}
                </Button>
              ))
            )
          ) : (
            <FilterEditor
              definition={editing}
              value={query.filterValues[editing.id]}
              onChange={(next) => setFilter(editing.id, next)}
            />
          )}
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="primary" onPress={close}>
            {t(UI_KEYS.ui.filter_bar.done)}
          </Button>
        </Drawer.Footer>
      </Drawer>
    </View>
  );
}
