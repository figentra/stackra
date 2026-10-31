/**
 * Stackra file contract:
 * Purpose: the native `FilterPanel`: the faceted filters of a `useCollection` engine on a phone. A "Filters" button
 *          opens a drawer of facets (one per filterable column: its editor, choice options labelled with their
 *          counts); the applied filters are clearable chips with a clear-all button; and the result count rolls to
 *          its new value.
 * Boundary: it keeps no data state: each facet is one top-level condition of the engine's filter (`useQuickFilters`,
 *           ADR 0505) and the counts are the app's. Saved views are `SavedViews` and the sort is the toolbar's (the
 *           panel's own tabs and sort menu were removed on 2026-10-31). It builds on `Drawer`, `FilterEditor`, `Chip`
 *           and `CloseButton`.
 *           The chip enter and exit and the count roll are Reanimated layout animations, left out under reduce
 *           motion. The words come from the `ui` catalogue in the active locale.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0505 (one filter model); ADR 0329 (motion
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

import type { CollectionItem } from "#contracts/types/collection-item.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { facetDefinitionOf } from "#core/functions/facet-definition-of.function";
import { filterChipTextOf } from "#core/functions/filter-chip-text-of.function";
import { filterChipWordsOf } from "#core/functions/filter-chip-words-of.function";
import { Button } from "#native/button/button";
import { Chip } from "#native/chip/chip";
import { CloseButton } from "#native/close-button/close-button";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { Drawer } from "#native/drawer/drawer";
import { FilterEditor } from "#native/filter-bar/filter-editor";
import { Text } from "#native/text/text";
import { useQuickFilters } from "#react/hooks/use-quick-filters";
import { useUiText } from "#react/hooks/use-ui-text";
import type { FilterPanelProps } from "#native/filter-panel/filter-panel.props";

/** The hit area added around a small button, so a touch target is at least 24 points (WCAG 2.5.8). */
const HIT_SLOP = 8;

/** Facets in a drawer and applied-filter chips over a `useCollection` engine. */
export function FilterPanel<TItem extends CollectionItem = CollectionItem>({
  collection,
  label,
  counts,
  resultCount = collection.totalCount,
  className,
  ...rest
}: FilterPanelProps<TItem>): ReactElement {
  const t = useUiText();
  const { locale } = useDesignSystem();
  const isReduced = useReducedMotion();
  const [isOpen, setOpen] = useState(false);
  const words = filterChipWordsOf(t);
  const {
    definitions: filters,
    valueOf,
    appliedIds,
    setValue,
    clearAll,
  } = useQuickFilters(collection);
  const applied = filters.filter((filter) => appliedIds.includes(filter.id));

  return (
    <View
      {...rest}
      accessibilityLabel={label}
      className={["gap-3", className].filter(Boolean).join(" ")}
    >
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
        <View className="ms-auto overflow-hidden" accessibilityLiveRegion="polite">
          <Animated.View key={resultCount} {...(isReduced ? {} : { entering: SlideInDown })}>
            <Text tone="muted">{t(UI_KEYS.ui.filter_panel.results, { count: resultCount })}</Text>
          </Animated.View>
        </View>
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
                {`${filter.label}: ${filterChipTextOf(filter, valueOf(filter.id), locale, words)}`}
              </Chip>
              <CloseButton
                label={t(UI_KEYS.ui.filter_bar.remove, { label: filter.label })}
                hitSlop={HIT_SLOP}
                onPress={() => setValue(filter.id, undefined)}
              />
            </Animated.View>
          ))}
          {collection.isFiltered ? (
            <Button variant="ghost" size="sm" onPress={clearAll}>
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
                  value={valueOf(filter.id)}
                  onChange={(value) => setValue(filter.id, value)}
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
