/**
 * Stackra file contract:
 * Purpose: the page under the showcase home's category tabs, laid out by width (`cardColumns`): the "All" page is, on a
 *          phone, one `CategoryShelf` per category with built entries (a swipeable row of big cards) and, from `sm`,
 *          group cards two then three per row; one category's page is its component cards one, two or three per row
 *          (a windowed FlatList, six cards first) under its hero and pillars (STA-1371).
 * Boundary: the page on screen only; the home owns which page that is and `CategoryTabs` switches it.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) sections 3.1, 3.3 and 5; ADR 0461 (core shows free only);
 *          STA-1371 (listing by width, 2026-10-28).
 */
import { byCategory, CATEGORIES, entryKey, type ComponentCategory } from "@stackra/showcase";
import { Text, useBreakpoint, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";
import Animated from "react-native-reanimated";

import { CategoryHero } from "#src/components/doc-screen/category-hero";
import { HOME_KEYS } from "#src/constants/home-keys.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { ALL_PAGE } from "./all-page.constant";
import { cardColumns } from "./card-columns.function";
import type { CategoryPagerProps } from "./category-pager.props";
import { CategoryShelf } from "./category-shelf";
import { ComponentCard } from "./component-card";
import { GroupCard } from "./group-card";
import { wholeRows } from "./whole-rows.function";

/** The showcase chrome's keys. */
const K = HOME_KEYS.showcase;

/** The grids' insets and gaps, in points. */
const GRID = { padding: 16, paddingBottom: 96, gap: 12 } as const;
const COLUMNS = { gap: 12 } as const;
/** The shelves' list: no side inset (each row bleeds to the screen's edges), more room between shelves. */
const SHELVES = { paddingTop: 16, paddingBottom: 96, gap: 28 } as const;
/** The header's room: it spans the grid's own padding. */
const HEADER = { marginHorizontal: -16, marginTop: -16, marginBottom: 4 } as const;

/** The categories with built entries, each with those entries. */
const FILLED = CATEGORIES.map(({ id }) => ({
  id,
  built: byCategory(id).filter((entry) => entry.status !== "planned"),
})).filter(({ built }) => built.length > 0);

/** The "All" page of shelves or group cards, or one category's component cards. */
export function CategoryPager({
  page,
  onOpen,
  onOpenCategory,
  previewOf,
  header,
  onScroll,
  listRef,
}: CategoryPagerProps) {
  const t = useCatalogueText(MESSAGES.en);
  const columns = cardColumns(useBreakpoint());
  // One list for every page of a width (keyed by its columns: FlatList cannot change them live), so switching a tab
  // keeps the scroll offset; under the transparent header its insets come from the system.
  const shared = {
    ...(listRef ? { ref: listRef } : {}),
    numColumns: columns,
    ...(columns > 1 ? { columnWrapperStyle: COLUMNS } : {}),
    contentContainerStyle: GRID,
    contentInsetAdjustmentBehavior: "automatic",
    ListHeaderComponent: header,
    ListHeaderComponentStyle: HEADER,
    onScroll,
    scrollEventThrottle: 16,
  } as const;
  if (page === ALL_PAGE && columns === 1) {
    return (
      <Animated.FlatList
        key={columns}
        {...shared}
        contentContainerStyle={SHELVES}
        ListHeaderComponentStyle={{ marginTop: -16 }}
        data={FILLED}
        keyExtractor={(category) => category.id}
        renderItem={({ item }) => (
          <CategoryShelf
            category={item.id}
            entries={item.built}
            onOpen={onOpen}
            onOpenCategory={onOpenCategory}
            previewOf={previewOf}
          />
        )}
      />
    );
  }
  if (page === ALL_PAGE) {
    return (
      <Animated.FlatList
        key={columns}
        {...shared}
        data={wholeRows(FILLED, columns)}
        keyExtractor={(category, index) => category?.id ?? `empty-${index}`}
        renderItem={({ item }) =>
          item ? (
            <GroupCard
              category={item.id}
              entries={item.built}
              onPress={onOpenCategory}
              previewOf={previewOf}
            />
          ) : (
            <View className="flex-1" />
          )
        }
      />
    );
  }
  return (
    <Animated.FlatList
      key={columns}
      {...shared}
      ListHeaderComponent={
        <>
          {header}
          <View className="px-4 pt-4">
            <CategoryHero category={page as ComponentCategory} />
          </View>
        </>
      }
      data={wholeRows(byCategory(page as ComponentCategory), columns)}
      keyExtractor={(entry, index) => (entry ? entryKey(entry) : `empty-${index}`)}
      initialNumToRender={6}
      ListEmptyComponent={<Text tone="muted">{t(K.ui.count_components, { count: 0 })}</Text>}
      renderItem={({ item }) =>
        item ? (
          <ComponentCard entry={item} onPress={onOpen} preview={previewOf?.(item)} />
        ) : (
          <View className="flex-1" />
        )
      }
    />
  );
}
