/**
 * Stackra file contract:
 * Purpose: the showcase home, the Home tab's root in development builds and the native twin of the web playground's
 *          home and `/components` index: on the ambient field, one scrolling list whose header is the landing hero
 *          (one of three, rotating per launch: `LandingHero`), the registry's count and the category tabs, over
 *          the page they select ("All" = group cards, a category = its component cards). The native header stays
 *          transparent (Liquid Glass's scroll edge on iOS 26) and its start slot holds the brand (`CompactBrand`).
 *          Typing in the header search swaps the list for the matching cards.
 *          A card opens the one `Component` screen with its tier and slug.
 * Boundary: presentation, the query, the page and navigation calls; the entries come from `@stackra/showcase` and
 *           their live previews from `demos/index.generated.ts` (the glyph stands in for an entry without demos).
 *           Release builds root the tab on `WelcomeScreen` instead.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 3.3; ADR 0320 (glass and the showcase stage);
 *          ADR 0310 (decision 6); STA-1371 (the hero header).
 */
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  COMPONENTS,
  entryKey,
  matchEntries,
  mobileRoute,
  type ComponentEntry,
} from "@stackra/showcase";
import { Text, useBreakpoint, useCatalogueText, useDesignSystem } from "@stackra/ui/native";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FlatList, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";

import { LandingHero } from "#src/components/heroes/landing-hero";
import { ALL_PAGE } from "#src/components/ui/all-page.constant";
import { Ambient } from "#src/components/ui/ambient";
import { cardColumns } from "#src/components/ui/card-columns.function";
import { CategoryPager } from "#src/components/ui/category-pager";
import { CategoryTabs } from "#src/components/ui/category-tabs";
import { CompactBrand } from "#src/components/ui/compact-brand";
import { ComponentCard } from "#src/components/ui/component-card";
import { ReviewIcons } from "#src/components/ui/review-icons";
import { wholeRows } from "#src/components/ui/whole-rows.function";
import { HOME_KEYS } from "#src/constants/home-keys.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { DEMOS } from "#src/demos/index.generated";
import { searchDocs } from "#src/functions/search-docs.function";
import type { HomeStackParamList } from "#src/navigation/types";
import { heroChoice } from "#src/stores/hero-choice.store";

/** The showcase chrome's keys. */
const K = HOME_KEYS.showcase;

/** The search grid's insets and gaps, in points. */
const GRID = { padding: 16, paddingBottom: 96, gap: 12 } as const;
const COLUMNS = { gap: 12 } as const;

/** The entry's thumbnail: its `card` demo live, else its first native demo, or undefined until its demos exist. */
function previewOf(entry: ComponentEntry) {
  const demos = DEMOS[entryKey(entry)]?.examples;
  const Demo = [...entry.examples]
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; main keeps sort here too, as Hermes support for toSorted is not assumed
    .sort((a, b) => Number(b.card ?? false) - Number(a.card ?? false))
    .map((example) => demos?.[example.id]?.Demo)
    .find(Boolean);
  return Demo ? <Demo /> : undefined;
}

/** The showcase home, inside the review area's icons. */
export function HomeScreen(props: NativeStackScreenProps<HomeStackParamList, "Home">) {
  return (
    <ReviewIcons>
      <ShowcaseHome {...props} />
    </ReviewIcons>
  );
}

/** The home itself: the header search, the count, the category tabs and their pager, or the search's cards. */
function ShowcaseHome({ navigation, route }: NativeStackScreenProps<HomeStackParamList, "Home">) {
  const [query, setQuery] = useState("");
  // `stackra://?hero=<id>` asks for a landing hero; an unknown id leaves this launch's pick.
  const askedHero = route.params?.hero;
  useEffect(() => {
    if (askedHero) heroChoice.set(askedHero);
  }, [askedHero]);
  const [page, setPage] = useState<string>(ALL_PAGE);
  const t = useCatalogueText(MESSAGES.en);
  const { locale } = useDesignSystem();
  const columns = cardColumns(useBreakpoint());
  const placeholder = t(K.ui.search_placeholder);
  const list = useRef<FlatList<unknown>>(null);
  // The hero's height, where "Browse components" scrolls to.
  const heroHeight = useSharedValue(0);

  useLayoutEffect(() => {
    navigation.setOptions({
      // The brand at the header's start edge (the right in Arabic: the header follows the app's direction).
      // oxlint-disable-next-line react/no-unstable-nested-components -- a render callback the navigator calls, not a component type
      headerLeft: () => <CompactBrand />,
      // iOS draws the screen's title string itself, so it is emptied rather than replaced by a null component.
      title: "",
      headerSearchBarOptions: {
        placeholder,
        hideWhenScrolling: true,
        placement: "stacked",
        onChangeText: (event) => setQuery(event.nativeEvent.text),
        onCancelButtonPress: () => setQuery(""),
      },
    });
  }, [navigation, placeholder]);

  const open = (entry: ComponentEntry) => {
    const { name, params } = mobileRoute(entry);
    navigation.navigate(name, params);
  };
  const hits = query.trim() ? matchEntries(searchDocs(t, locale), query) : undefined;
  const found = hits?.flatMap((hit) =>
    COMPONENTS.filter((entry) => entryKey(entry) === hit.doc.key),
  );

  return (
    <View className="flex-1">
      <Ambient />
      {found ? (
        <FlatList
          key={columns}
          data={wholeRows(found, columns)}
          numColumns={columns}
          keyExtractor={(entry, index) => (entry ? entryKey(entry) : `empty-${index}`)}
          {...(columns > 1 ? { columnWrapperStyle: COLUMNS } : {})}
          contentContainerStyle={GRID}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Text tone="muted" accessibilityLiveRegion="polite">
              {found.length === 0
                ? t(K.ui.no_results, { query })
                : t(K.ui.count_components, { count: found.length })}
            </Text>
          }
          renderItem={({ item }) =>
            item ? (
              <ComponentCard entry={item} onPress={open} preview={previewOf(item)} />
            ) : (
              <View className="flex-1" />
            )
          }
        />
      ) : (
        <CategoryPager
          page={page}
          onOpen={open}
          onOpenCategory={setPage}
          previewOf={previewOf}
          listRef={list}
          header={
            <View className="gap-2">
              <View onLayout={(event) => heroHeight.set(event.nativeEvent.layout.height)}>
                <LandingHero
                  onBrowse={() =>
                    list.current?.scrollToOffset({ offset: heroHeight.value, animated: true })
                  }
                  onTheme={() => navigation.getParent()?.navigate("SettingsTab")}
                />
              </View>
              <Text type="small" tone="muted" className="px-4">
                {t(K.ui.count_components, { count: COMPONENTS.length })}
              </Text>
              <CategoryTabs label={t(K.ui.components)} page={page} onPageChange={setPage} />
            </View>
          }
        />
      )}
    </View>
  );
}
