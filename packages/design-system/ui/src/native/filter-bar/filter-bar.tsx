/**
 * Stackra file contract:
 * Purpose: the native `FilterBar`, the adapted form of ADR 0302 (decision 3) and ADR 0318 (decision 10), on the web
 *          one's contract. A phone has no room for a popover beside every chip, so the bar is a `SearchField` over one
 *          horizontal row (an add-filter button, an "Advanced" button, one chip per applied quick filter, a read-only
 *          chip with a remove button per other condition of the engine's filter, and clear-all while it narrows),
 *          and every editor opens in one inset `Drawer`: the "add filter" press opens it on the list of filters not yet
 *          applied, choosing one swaps the same sheet to that filter's editor, and a chip opens it on its own editor.
 *          A chip is a button that opens its editor and a close button that removes the filter; "Advanced" opens the
 *          same sheet on a `RuleBuilder` of the whole top level of the filter. Every other `View` prop passes through.
 * Boundary: it holds no data state: every change goes to the `useCollection` engine (`useQuickFilters`), and only the
 *           sheet's own state (closed, adding, advanced, or editing one filter) lives here. A quick filter is one
 *           top-level condition of the engine's `CollectionFilter` (ADR 0505). A filter
 *           whose value filters nothing has no chip once its sheet closes (ADR 0318 decision 3). The sheet is the
 *           Drawer of wave 4, so it is HeroUI Native's inset style by the owner's decision of 2026-10-24, and it is never
 *           stacked on another sheet: "add" and "edit" are two contents of one. Strings are always wrapped in `Text`,
 *           which React Native requires. Native has no focus to move after a chip goes. The words are defaults
 *           from the `ui` catalogue in the active locale. Builds on earlier waves and, through `FilterEditor`, on NumberField and DateField, leaf
 *           groups of this wave (ADR 0318 decision 4). Needs the native `DesignSystemProvider`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318 (decisions 1 to 4 and 10); ADR 0505 (one
 *          filter model); ADR 0165 (HeroUI
 *          Native on native); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.5.8, 4.1.2; owner decision 6 of STA-350
 *          (thin wrappers).
 */
import { useState, type ReactElement } from "react";
import { ScrollView, View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useQuickFilters } from "#react/hooks/use-quick-filters";
import { useUiText } from "#react/hooks/use-ui-text";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import { collectionRuleFieldsOf } from "#core/functions/collection-rule-fields-of.function";
import { filterChipTextOf } from "#core/functions/filter-chip-text-of.function";
import { filterChipWordsOf } from "#core/functions/filter-chip-words-of.function";
import { quickFilterIdOf } from "#core/functions/quick-filter-id-of.function";
import { Button } from "#native/button/button";
import { CloseButton } from "#native/close-button/close-button";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { Drawer } from "#native/drawer/drawer";
import { Chip } from "#native/chip/chip";
import { FilterEditor } from "#native/filter-bar/filter-editor";
import { IconButton } from "#native/icon-button/icon-button";
import { RuleBuilder } from "#native/rule-builder/rule-builder";
import { SearchField } from "#native/search-field/search-field";
import { Text } from "#native/text/text";
import { Tooltip } from "#native/tooltip/tooltip";
import type { FilterBarProps } from "#native/filter-bar/filter-bar.props";

/** What the sheet shows: nothing (closed), the list of filters to add, or the editor of one filter. */
type Sheet =
  | { readonly mode: "add" }
  | { readonly mode: "advanced" }
  | { readonly mode: "edit"; readonly id: string }
  | null;

/** The hit area added around a small button, so a touch target is at least 24 points (WCAG 2.5.8). */
const HIT_SLOP = 8;

/** No unapplied conditions, one array for every render. */
const NONE: readonly string[] = [];

/** The classes of a chip row, drawn as a warning when the data source does not apply it. */
const rowClassOf = (isUnapplied: boolean) =>
  isUnapplied
    ? "flex-row items-center gap-1 rounded-[var(--radius-control)] bg-warning-soft pe-1"
    : "flex-row items-center gap-1";

/** The warning that leads a chip the data source does not apply: a button named, and hinted, by the words. */
function UnappliedMark({ words }: { readonly words: string }): ReactElement {
  return (
    <Tooltip content={words}>
      <IconButton
        icon="triangle-alert"
        label={words}
        variant="ghost"
        size="sm"
        className="text-warning"
      />
    </Tooltip>
  );
}

/**
 * The search and filters of a `useCollection` engine, for a phone. Put it in the `filterBar` slot of a `DataTable`
 * given the same engine.
 */
export function FilterBar<TItem extends CollectionItem = CollectionItem>({
  collection,
  searchLabel,
  searchPlaceholder,
  unappliedIds = NONE,
  accessibilityLabel,
  ...rest
}: FilterBarProps<TItem>): ReactElement {
  const t = useUiText();
  const { locale } = useDesignSystem();
  const [sheet, setSheet] = useState<Sheet>(null);
  const {
    definitions: filters,
    definitionOf,
    valueOf,
    appliedIds,
    others,
    setValue: setFilter,
    clearAll,
  } = useQuickFilters(collection);
  const topFilter = collection.state.filter;
  const editingId = sheet?.mode === "edit" ? sheet.id : null;
  // The filter whose editor is open has a chip even while it filters nothing; it goes after the applied ones.
  const chipIds =
    editingId !== null && definitionOf(editingId) !== undefined && !appliedIds.includes(editingId)
      ? [...appliedIds, editingId]
      : appliedIds;
  const addable = filters.filter((filter) => !chipIds.includes(filter.id));
  const editing = editingId === null ? undefined : definitionOf(editingId);

  const close = () => setSheet(null);
  const title =
    sheet?.mode === "advanced"
      ? t(UI_KEYS.ui.filter_bar.advanced)
      : (editing?.label ?? t(UI_KEYS.ui.filter_bar.add));

  const renderChip = (definition: FilterDefinition) => {
    const summary = filterChipTextOf(
      definition,
      valueOf(definition.id),
      locale,
      filterChipWordsOf(t),
    );
    const isUnapplied = unappliedIds.includes(quickFilterIdOf(definition.id));
    return (
      <View key={definition.id} className={rowClassOf(isUnapplied)}>
        {isUnapplied ? <UnappliedMark words={t(UI_KEYS.ui.filter_bar.unapplied)} /> : null}
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
        value={collection.state.search}
        onChange={collection.setSearch}
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
        <Button
          variant="ghost"
          size="sm"
          startIcon="sliders-horizontal"
          onPress={() => setSheet({ mode: "advanced" })}
        >
          {t(UI_KEYS.ui.filter_bar.advanced)}
        </Button>
        {chipIds.map((id) => {
          const definition = definitionOf(id);
          return definition === undefined ? null : renderChip(definition);
        })}
        {others.map((other) => (
          <View key={other.id} className={rowClassOf(unappliedIds.includes(other.id))}>
            {unappliedIds.includes(other.id) ? (
              <UnappliedMark words={t(UI_KEYS.ui.filter_bar.unapplied)} />
            ) : null}
            <Chip
              variant="secondary"
              {...(unappliedIds.includes(other.id) ? { tone: "warning" as const } : {})}
            >
              {other.text}
            </Chip>
            <CloseButton
              label={t(UI_KEYS.ui.filter_bar.remove, { label: other.text })}
              hitSlop={HIT_SLOP}
              onPress={other.remove}
            />
          </View>
        ))}
        {collection.isFiltered ? (
          <Button
            variant="ghost"
            size="sm"
            onPress={() => {
              close();
              clearAll();
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
        label={title}
      >
        <Drawer.Header>
          <Drawer.Title>{title}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          {sheet?.mode === "advanced" ? (
            <RuleBuilder
              label={title}
              fields={collectionRuleFieldsOf(collection.columns)}
              value={topFilter}
              onChange={(top) => collection.setFilter({ ...top, groups: topFilter.groups ?? [] })}
            />
          ) : editing === undefined ? (
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
              value={valueOf(editing.id)}
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
