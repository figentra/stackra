/**
 * Stackra file contract:
 * Purpose: the native `DataView`, the adapted form of the web one (ADR 0302 decision 3): a search field and an options
 *          button over the rows, a list or cards switcher with the result count, the filter conditions as removable
 *          chips, and the rows drawn as a `List` (leading media, primary and secondary text, trailing meta) or as cards
 *          (title, subtitle, meta and fields), grouped when the engine groups. The options button opens a bottom sheet
 *          with the sort keys (direction and remove per key, and a select that adds one), the and/or filter (a
 *          `RuleBuilder` for the top level), the group by and the view.
 * Boundary: it keeps no data state: every tool changes the `useCollection` engine, shared with the web through
 *           `#react/hooks`. The native DataView offers the list and cards views only (a phone's); the table, grid,
 *           export, import and full screen are the web's. Strings are always wrapped in `Text`, which React Native
 *           requires.
 * Runtime: react-native
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); ADR 0505 (one filter model); ADR 0165 (HeroUI Native);
 *          ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.5.8, 4.1.2, 4.1.3.
 */
import { IconRegistryProvider } from "@stackra/icons/native";
import { useState, type ReactElement, type ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { ResolvedCollectionColumn } from "#contracts/types/resolved-collection-column.type";
import type { RuleCondition } from "#contracts/types/rule-condition.type";
import { COLLECTION_KEYS } from "#core/constants/collection-keys.constant";
import { DATA_GRID_KEYS } from "#core/constants/data-grid-keys.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { cellTextOf } from "#core/functions/cell-text-of.function";
import { collectionRuleFieldsOf } from "#core/functions/collection-rule-fields-of.function";
import { conditionChipTextOf } from "#core/functions/condition-chip-text-of.function";
import { dataViewFieldsOf } from "#core/functions/data-view-fields-of.function";
import { filterConditionCountOf } from "#core/functions/filter-condition-count-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import { Card } from "#native/card/card";
import { Chip } from "#native/chip/chip";
import { CloseButton } from "#native/close-button/close-button";
import { NATIVE_DATA_VIEW_ICON_NAMES as I } from "#native/data-view/data-view-icon-names.constant";
import { NATIVE_DATA_VIEW_ICONS } from "#native/data-view/data-view-icons.constant";
import type { DataViewProps } from "#native/data-view/data-view.props";
import { Drawer } from "#native/drawer/drawer";
import { IconButton } from "#native/icon-button/icon-button";
import { List } from "#native/list/list";
import { RuleBuilder } from "#native/rule-builder/rule-builder";
import { SearchField } from "#native/search-field/search-field";
import { SegmentedControl } from "#native/segmented-control/segmented-control";
import { Select } from "#native/select/select";
import { Text } from "#native/text/text";

/** The words. */
const K = COLLECTION_KEYS.ui.collection;

/** The extra touch area of a chip's remove button, up to 44 points. */
const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 } as const;

/** A bare string or number as Text; any other node as it is. */
function textNode(node: ReactNode, type?: "small"): ReactNode {
  return typeof node === "string" || typeof node === "number" ? (
    <Text {...(type ? { type } : {})}>{String(node)}</Text>
  ) : (
    node
  );
}

/** A collection drawn as a list or cards under a search field and an options sheet. */
export function DataView<TItem extends CollectionItem = CollectionItem>({
  label,
  collection,
  layouts: givenLayouts,
  phoneLayout = "list",
  renderCell,
  list,
  cards,
  onItemPress,
  emptyState,
  className,
  // The web-only props are read as nothing on native.
  rowActions: _rowActions,
  bulkActions: _bulkActions,
  selectionMode: _selectionMode,
  onGridSave: _onGridSave,
  exportOptions: _exportOptions,
  importOptions: _importOptions,
  onShareView: _onShareView,
  onRefresh: _onRefresh,
  hasFullscreen: _hasFullscreen,
  renderLayout,
  ...rest
}: DataViewProps<TItem>): ReactElement {
  const t = useUiText();
  const [isOpen, setOpen] = useState(false);
  const { state } = collection;
  const layouts = (givenLayouts ?? ["list", "cards"]).filter(
    (entry) => entry === "list" || entry === "cards" || renderLayout?.[entry] !== undefined,
  );
  const layout = layouts.includes(state.layout) ? state.layout : phoneLayout;
  const slots = dataViewFieldsOf(layout === "cards" ? cards : list, collection.visibleColumns);
  const fieldsOf = layout === "cards" ? cards : list;
  const valueOf = (item: TItem, column: ResolvedCollectionColumn | undefined): ReactNode =>
    column === undefined
      ? null
      : renderCell
        ? renderCell(item, column)
        : cellTextOf(item, column.id);
  const fieldLabel = (id: string) =>
    collection.columns.find((column) => column.id === id)?.label ?? id;
  const chipText = (condition: RuleCondition) =>
    conditionChipTextOf(condition, collection.columns, (operator) =>
      t(UI_KEYS.ui.rule_operator[operator]),
    );
  const groupable = collection.columns.filter((column) => column.isGroupable);
  const sortable = collection.columns.filter((column) => column.isSortable);

  const rowsOf = (items: readonly TItem[], name: string): ReactNode =>
    layout === "list" ? (
      <List
        label={name}
        isAnimated={false}
        items={items.map((item) => {
          const media = fieldsOf?.media?.(item);
          return {
            id: item.id,
            title: valueOf(item, slots.title) ?? item.id,
            label: slots.title ? cellTextOf(item, slots.title.id) : item.id,
            description: slots.subtitle ? valueOf(item, slots.subtitle) : undefined,
            ...(media && typeof media === "object" ? { startIcon: media as ReactElement } : {}),
            endContent: slots.meta ? valueOf(item, slots.meta) : undefined,
            ...(onItemPress ? { hasChevron: true, onPress: () => onItemPress(item) } : {}),
          };
        })}
      />
    ) : (
      <View className="gap-3" accessibilityLabel={name}>
        {items.map((item) => {
          const card = (
            <Card>
              {fieldsOf?.media?.(item) ?? null}
              <Card.Header>
                <View className="flex-row items-start justify-between gap-2">
                  <View className="min-w-0 flex-1">{textNode(valueOf(item, slots.title))}</View>
                  {slots.meta ? textNode(valueOf(item, slots.meta), "small") : null}
                </View>
                {slots.subtitle ? textNode(valueOf(item, slots.subtitle), "small") : null}
              </Card.Header>
              <Card.Content>
                {slots.fields.map((column) => (
                  <View key={column.id} className="flex-row justify-between gap-3">
                    <Text type="small" className="text-muted">
                      {column.label}
                    </Text>
                    {textNode(valueOf(item, column), "small")}
                  </View>
                ))}
              </Card.Content>
            </Card>
          );
          return onItemPress ? (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={slots.title ? cellTextOf(item, slots.title.id) : item.id}
              onPress={() => onItemPress(item)}
            >
              {card}
            </Pressable>
          ) : (
            <View key={item.id}>{card}</View>
          );
        })}
      </View>
    );

  const body: ReactNode =
    renderLayout?.[layout]?.() ??
    (collection.rows.length === 0 && !collection.isLoading
      ? emptyState
      : collection.groups
        ? collection.groups.map((group) => {
            const name = `${group.key} · ${t(DATA_GRID_KEYS.ui.data_table_tools.group_count, { count: group.items.length })}`;
            return (
              <View key={group.key} className="gap-2">
                <Text type="small" accessibilityRole="header" className="text-muted">
                  {name}
                </Text>
                {rowsOf(group.items, name)}
              </View>
            );
          })
        : rowsOf(collection.rows, label));

  return (
    <IconRegistryProvider registry={NATIVE_DATA_VIEW_ICONS}>
      <View {...rest} className={["gap-3", className].filter(Boolean).join(" ")}>
        <View className="flex-row items-center gap-2">
          <View className="min-w-0 flex-1">
            <SearchField
              aria-label={t(K.search, { label })}
              placeholder={t(K.search, { label })}
              value={state.search}
              onChange={collection.setSearch}
            />
          </View>
          <IconButton
            icon={I.options}
            label={t(K.options)}
            variant="secondary"
            onPress={() => setOpen(true)}
          />
        </View>
        <View className="flex-row items-center justify-between gap-2">
          {layouts.length > 1 ? (
            <SegmentedControl
              label={t(K.layout)}
              size="sm"
              selectedKey={layout}
              onSelectionChange={(key) => {
                const next = layouts.find((entry) => entry === key);
                if (next) collection.setLayout(next);
              }}
              items={layouts.map((entry) => ({ id: entry, label: t(K[`layout_${entry}`]) }))}
            />
          ) : (
            <View />
          )}
          <Text type="small" accessibilityLiveRegion="polite" className="text-muted">
            {t(K.results, { count: collection.totalCount })}
          </Text>
        </View>
        {state.filter.conditions.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="items-center gap-2"
          >
            {state.filter.conditions.map((condition) => (
              <View key={condition.id} className="flex-row items-center gap-1">
                <Chip variant="secondary">{chipText(condition)}</Chip>
                <CloseButton
                  label={t(K.remove_filter, { text: chipText(condition) })}
                  hitSlop={HIT_SLOP}
                  onPress={() =>
                    collection.setFilter({
                      ...state.filter,
                      conditions: state.filter.conditions.filter(
                        (entry) => entry.id !== condition.id,
                      ),
                    })
                  }
                />
              </View>
            ))}
          </ScrollView>
        ) : null}
        {body}
        <Drawer isOpen={isOpen} onOpenChange={setOpen} label={t(K.options)} placement="bottom">
          <Drawer.Header>
            <Drawer.Title>{t(K.options)}</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <View className="gap-5">
              <View className="gap-2">
                <Text accessibilityRole="header">
                  {t(K.sort_count, { count: state.sort.length })}
                </Text>
                {state.sort.length === 0 ? (
                  <Text type="small" className="text-muted">
                    {t(K.sort_empty)}
                  </Text>
                ) : null}
                {state.sort.map((key) => {
                  const name = fieldLabel(key.column);
                  const isAscending = key.direction === "ascending";
                  return (
                    <View key={key.column} className="flex-row items-center gap-2">
                      <Text className="min-w-0 flex-1">{name}</Text>
                      <IconButton
                        icon={isAscending ? I.ascending : I.descending}
                        label={`${t(K.sort_direction, { label: name })}: ${t(isAscending ? UI_KEYS.ui.table.ascending : UI_KEYS.ui.table.descending)}`}
                        variant="secondary"
                        size="sm"
                        onPress={() =>
                          collection.setSort(
                            state.sort.map((entry) =>
                              entry.column === key.column
                                ? { ...entry, direction: isAscending ? "descending" : "ascending" }
                                : entry,
                            ),
                          )
                        }
                      />
                      <IconButton
                        icon={I.remove}
                        label={t(K.remove_sort, { label: name })}
                        variant="ghost"
                        size="sm"
                        onPress={() =>
                          collection.setSort(
                            state.sort.filter((entry) => entry.column !== key.column),
                          )
                        }
                      />
                    </View>
                  );
                })}
                {sortable.some((column) => !state.sort.some((key) => key.column === column.id)) ? (
                  <Select
                    label={t(K.add_sort_key)}
                    placeholder={t(K.add_sort_key)}
                    items={sortable
                      .filter((column) => !state.sort.some((key) => key.column === column.id))
                      .map((column) => ({ id: column.id, label: column.label }))}
                    value={null}
                    onChange={(id) => {
                      if (id)
                        collection.setSort([...state.sort, { column: id, direction: "ascending" }]);
                    }}
                  />
                ) : null}
              </View>
              <View className="gap-2">
                <Text accessibilityRole="header">
                  {t(K.filter_count, { count: filterConditionCountOf(state.filter) })}
                </Text>
                <RuleBuilder
                  label={t(K.filter_title, { label })}
                  fields={collectionRuleFieldsOf(collection.columns)}
                  value={state.filter}
                  onChange={(top) =>
                    collection.setFilter({ ...top, groups: state.filter.groups ?? [] })
                  }
                />
              </View>
              {groupable.length > 0 ? (
                <Select
                  label={t(K.group_by)}
                  items={[
                    { id: "none", label: t(K.group_none) },
                    ...groupable.map((column) => ({ id: column.id, label: column.label })),
                  ]}
                  value={state.groupBy ?? "none"}
                  onChange={(id) => collection.setGroupBy(id === null || id === "none" ? null : id)}
                />
              ) : null}
            </View>
          </Drawer.Body>
          <Drawer.Footer>
            <Button variant="primary" onPress={() => setOpen(false)}>
              {t(K.done)}
            </Button>
          </Drawer.Footer>
        </Drawer>
      </View>
    </IconRegistryProvider>
  );
}
