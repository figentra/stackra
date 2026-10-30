/**
 * Stackra file contract:
 * Purpose: the Search tab's screen in development builds: the showcase search on a tab of its own, which iOS 26
 *          draws as the search button beside the tab bar. The header search field runs the showcases' one rule
 *          (`matchEntries`) over the registry worded in the current locale; a row shows the title, the category and
 *          tier and why it matched, and a press opens the `Component` screen in the Home tab, on the API tab when a
 *          prop matched.
 * Boundary: presentation, the query and navigation calls; release builds have no Search tab.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) sections 3.3 and 7.5; ADR 0310 (decision 6); STA-429.
 */
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { I18nKey } from "@stackra/i18n";
import {
  categoryKeys,
  COMPONENTS,
  entryKey,
  matchEntries,
  mobileRoute,
  type MobileComponentParams,
  type SearchHit,
} from "@stackra/showcase";
import { haptics, Surface, Text, useCatalogueText, useDesignSystem } from "@stackra/ui/native";
import { useLayoutEffect, useState } from "react";
import { Pressable } from "react-native";

import { ReviewIcons } from "../components/ui/review-icons";
import { Screen } from "../components/ui/screen";
import { HOME_KEYS } from "../constants/home-keys.constant";
import { MESSAGES } from "../constants/messages.constant";
import { searchDocs } from "../functions/search-docs.function";
import type { SearchStackParamList } from "../navigation/search-stack-param-list.type";

/** The showcase chrome's keys. */
const K = HOME_KEYS.showcase;

/** Opens a component in the Home tab's stack, where the showcase lives. */
type OpenInHome = (
  tab: "HomeTab",
  params: { screen: "Component"; params: MobileComponentParams },
) => void;

/** The Search tab: the header search and its matches, inside the area's icons. */
export function SearchScreen(props: NativeStackScreenProps<SearchStackParamList, "Search">) {
  return (
    <ReviewIcons>
      <SearchResults {...props} />
    </ReviewIcons>
  );
}

/** The matches of the header search, as rows. */
function SearchResults({ navigation }: NativeStackScreenProps<SearchStackParamList, "Search">) {
  const [query, setQuery] = useState("");
  const t = useCatalogueText(MESSAGES.en);
  const { locale } = useDesignSystem();
  const placeholder = t(K.ui.search_placeholder);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        placeholder,
        hideWhenScrolling: false,
        onChangeText: (event) => setQuery(event.nativeEvent.text),
        onCancelButtonPress: () => setQuery(""),
      },
    });
  }, [navigation, placeholder]);

  const hits = query.trim() ? matchEntries(searchDocs(t, locale), query) : undefined;
  const open = (hit: SearchHit) => {
    const entry = COMPONENTS.find((candidate) => entryKey(candidate) === hit.doc.key);
    if (!entry) return;
    haptics.play("impact");
    // navigate() bubbles to the tab navigator; its per-route overloads do not reach a nested screen's params.
    (navigation.navigate as OpenInHome)("HomeTab", {
      screen: "Component",
      params: mobileRoute(entry, hit.reason === "prop" ? "api" : undefined).params,
    });
  };

  return (
    <Screen isAmbient>
      {hits ? (
        <Text tone="muted" accessibilityLiveRegion="polite">
          {hits.length === 0
            ? t(K.ui.no_results, { query })
            : t(K.ui.count_components, { count: hits.length })}
        </Text>
      ) : null}
      {hits?.map((hit) => (
        <Pressable key={hit.doc.key} accessibilityRole="button" onPress={() => open(hit)}>
          <Surface className="gap-0.5">
            <Text className="font-semibold">{hit.doc.title}</Text>
            <Text type="small" tone="muted">
              {t(categoryKeys(hit.doc.category).title as I18nKey)}
            </Text>
            <Text type="caption" tone="muted">
              {t(K.search.reason[hit.reason], { name: hit.matched })}
            </Text>
          </Surface>
        </Pressable>
      ))}
    </Screen>
  );
}
