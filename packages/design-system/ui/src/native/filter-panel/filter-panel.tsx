/**
 * Stackra file contract:
 * Purpose: the native `FilterPanel`: the faceted filters of a resource index on a phone. Saved views are tabs that
 *          apply their whole query; a "Filters" button opens a drawer of facets (each filter's editor, choice options
 *          labelled with their counts); a sort menu picks the column and the direction; the applied filters are
 *          clearable chips with a clear-all button; and the result count rolls to its new value.
 * Boundary: controlled only, as `FilterBar` is: each change calls `onQueryChange` with the whole next query and the
 *           counts are the app's. It builds on `Tabs`, `Drawer`, `FilterEditor`, `Menu`, `Chip` and `CloseButton`.
 *           The chip enter and exit and the count roll are Reanimated layout animations, left out under reduce
 *           motion. The words come from the `ui` catalogue in the active locale.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318 (decisions 1 to 3); ADR 0329 (motion
 *          layer); design-system gap inventory (2026-10-28) row 9.
 */
import { useState, type ReactElement } from "react";
import { ScrollView, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  SlideInDown,
  useReducedMotion,
} from "react-native-reanimated";

import type { AriaSortDirection } from "#contracts/enums/aria-sort-direction.enum";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { clearResourceQueryFilters } from "#core/functions/clear-resource-query-filters.function";
import { facetDefinitionOf } from "#core/functions/facet-definition-of.function";
import { filterChipTextOf } from "#core/functions/filter-chip-text-of.function";
import { filterChipWordsOf } from "#core/functions/filter-chip-words-of.function";
import { isFilterValueEmpty } from "#core/functions/is-filter-value-empty.function";
import { isResourceQueryFiltered } from "#core/functions/is-resource-query-filtered.function";
import { queryWithFilter } from "#core/functions/query-with-filter.function";
import { Button } from "#native/button/button";
import { Chip } from "#native/chip/chip";
import { CloseButton } from "#native/close-button/close-button";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { Drawer } from "#native/drawer/drawer";
import { FilterEditor } from "#native/filter-bar/filter-editor";
import { Menu } from "#native/menu/menu";
import { Tabs } from "#native/tabs/tabs";
import { Text } from "#native/text/text";
import { useUiText } from "#react/hooks/use-ui-text";
import type { FilterPanelProps } from "#native/filter-panel/filter-panel.props";

/** The hit area added around a small button, so a touch target is at least 24 points (WCAG 2.5.8). */
const HIT_SLOP = 8;

/** The `views` default, one array for every render. */
const NO_VIEWS: NonNullable<FilterPanelProps["views"]> = [];

/** The `sortOptions` default, one array for every render. */
const NO_SORT_OPTIONS: NonNullable<FilterPanelProps["sortOptions"]> = [];

/** Facets in a drawer, applied-filter chips, saved views and a sort menu. Controlled. */
export function FilterPanel({
  query,
  onQueryChange,
  filters,
  label,
  counts,
  resultCount,
  views = NO_VIEWS,
  activeViewId,
  onViewChange,
  sortOptions = NO_SORT_OPTIONS,
  className,
  ...rest
}: FilterPanelProps): ReactElement {
  const t = useUiText();
  const { locale } = useDesignSystem();
  const isReduced = useReducedMotion();
  const [isOpen, setOpen] = useState(false);
  const words = filterChipWordsOf(t);
  const applied = filters.filter((filter) => {
    const value = query.filterValues[filter.id];
    return value !== undefined && !isFilterValueEmpty(value);
  });
  const sort = query.sort;

  return (
    <View
      {...rest}
      accessibilityLabel={label}
      className={["gap-3", className].filter(Boolean).join(" ")}
    >
      {views.length > 0 ? (
        <Tabs
          label={t(UI_KEYS.ui.filter_panel.views)}
          items={views.map((view) => ({ id: view.id, label: view.label, content: null }))}
          selectedKeys={[activeViewId ?? views[0]?.id ?? ""]}
          onSelectionChange={([id]) => {
            const view = views.find((candidate) => candidate.id === id);
            if (view === undefined) return;
            onQueryChange(view.query);
            onViewChange?.(view.id);
          }}
        />
      ) : null}
      <View className="flex-row flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          startIcon="sliders-horizontal"
          onPress={() => setOpen(true)}
        >
          {applied.length === 0
            ? t(UI_KEYS.ui.filter_bar.filters)
            : t(UI_KEYS.ui.filter_panel.facet_option, {
                label: t(UI_KEYS.ui.filter_bar.filters),
                count: applied.length,
              })}
        </Button>
        {sortOptions.length === 0 ? null : (
          <Menu
            selectionMode="single"
            sections={[
              {
                id: "column",
                title: t(UI_KEYS.ui.table.sort_by),
                items: sortOptions.map((option) => ({ id: option.column, label: option.label })),
              },
              {
                id: "direction",
                title: t(UI_KEYS.ui.filter_panel.order),
                items: [
                  { id: "ascending", label: t(UI_KEYS.ui.table.ascending) },
                  { id: "descending", label: t(UI_KEYS.ui.table.descending) },
                ],
              },
            ]}
            value={sort === null ? [] : [sort.column, sort.direction]}
            onChange={(chosen) => {
              const direction = (chosen.find((id) => id === "ascending" || id === "descending") ??
                "ascending") as AriaSortDirection;
              const column = chosen.find((id) =>
                sortOptions.some((option) => option.column === id),
              );
              if (column !== undefined) onQueryChange({ ...query, sort: { column, direction } });
            }}
          >
            <Button variant="outline" size="sm" startIcon="arrow-up-down">
              {t(UI_KEYS.ui.filter_panel.sort)}
            </Button>
          </Menu>
        )}
        {resultCount === undefined ? null : (
          <View className="ms-auto overflow-hidden" accessibilityLiveRegion="polite">
            <Animated.View key={resultCount} {...(isReduced ? {} : { entering: SlideInDown })}>
              <Text tone="muted">{t(UI_KEYS.ui.filter_panel.results, { count: resultCount })}</Text>
            </Animated.View>
          </View>
        )}
      </View>
      {applied.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          accessibilityLabel={t(UI_KEYS.ui.filter_panel.applied)}
          contentContainerClassName="items-center gap-2"
        >
          {applied.map((filter) => (
            <Animated.View
              key={filter.id}
              className="flex-row items-center gap-1"
              {...(isReduced
                ? {}
                : { entering: FadeIn, exiting: FadeOut, layout: LinearTransition })}
            >
              <Chip variant="secondary">
                {`${filter.label}: ${filterChipTextOf(filter, query.filterValues[filter.id], locale, words)}`}
              </Chip>
              <CloseButton
                label={t(UI_KEYS.ui.filter_bar.remove, { label: filter.label })}
                hitSlop={HIT_SLOP}
                onPress={() => onQueryChange(queryWithFilter(query, filter.id, undefined))}
              />
            </Animated.View>
          ))}
          {isResourceQueryFiltered(query) ? (
            <Button
              variant="ghost"
              size="sm"
              onPress={() => onQueryChange(clearResourceQueryFilters(query))}
            >
              {t(UI_KEYS.ui.filter_bar.clear_all)}
            </Button>
          ) : null}
        </ScrollView>
      ) : null}
      <Drawer isOpen={isOpen} onOpenChange={setOpen} label={label}>
        <Drawer.Header>
          <Drawer.Title>{label}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <View className="gap-5">
            {filters.map((filter) => (
              <View key={filter.id} className="gap-2">
                <Text accessibilityRole="header">{filter.label}</Text>
                <FilterEditor
                  definition={facetDefinitionOf(filter, counts?.[filter.id], (option, count) =>
                    t(UI_KEYS.ui.filter_panel.facet_option, { label: option, count }),
                  )}
                  value={query.filterValues[filter.id]}
                  onChange={(value) => onQueryChange(queryWithFilter(query, filter.id, value))}
                />
              </View>
            ))}
          </View>
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="primary" onPress={() => setOpen(false)}>
            {t(UI_KEYS.ui.filter_bar.done)}
          </Button>
        </Drawer.Footer>
      </Drawer>
    </View>
  );
}
