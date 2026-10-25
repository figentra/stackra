/**
 * Stackra file contract:
 * Purpose: the Search tab's screen in development builds: the review area's search on a tab of its own, which iOS 26
 *          draws as the search button beside the tab bar. The header search field filters every page by the landing's
 *          rule (`matchPages`), and a match opens its page in the Home tab, inside its category strip and pager.
 * Boundary: presentation, the query and navigation calls; release builds have no Search tab, and the pages come in
 *          gallery order from `design-system-components.ts`.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6, the review area); ADR 0060 (light, dark, RTL); STA-429.
 */
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Text } from "@stackra/ui/native";
import { useLayoutEffect, useState } from "react";

import { matchPages } from "../components/ui/match-pages";
import { PageGallery } from "../components/ui/page-gallery";
import { ReviewIcons } from "../components/ui/review-icons";
import { Screen } from "../components/ui/screen";
import type { DesignSystemComponentRoute, SearchStackParamList } from "../navigation/types";
import { DESIGN_SYSTEM_COMPONENTS } from "./design-system-components";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  placeholder: "Search components and categories…",
  hint: "Type a component, a category, or Free or Pro.",
  results: (count: number) => (count === 1 ? "1 match" : `${count} matches`),
  empty: (query: string) => `Nothing matches “${query}”.`,
} as const;

/** Opens a page in the Home tab's stack, where the review area's pages live. */
type OpenInHome = (tab: "HomeTab", params: { screen: DesignSystemComponentRoute }) => void;

/** The Search tab: the header search and its matches, inside the area's icons. */
export function SearchScreen(props: NativeStackScreenProps<SearchStackParamList, "Search">) {
  return (
    <ReviewIcons>
      <SearchResults {...props} />
    </ReviewIcons>
  );
}

/** The matches of the header search, or a hint while it is empty. */
function SearchResults({ navigation }: NativeStackScreenProps<SearchStackParamList, "Search">) {
  const [query, setQuery] = useState("");
  // navigate() bubbles to the tab navigator; its per-route overloads cannot take a union of route names.
  const openPage = (route: DesignSystemComponentRoute) =>
    (navigation.navigate as OpenInHome)("HomeTab", { screen: route });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        placeholder: STRINGS.placeholder,
        hideWhenScrolling: false,
        onChangeText: (event) => setQuery(event.nativeEvent.text),
        onCancelButtonPress: () => setQuery(""),
      },
    });
  }, [navigation]);

  const found = query.trim() ? matchPages(DESIGN_SYSTEM_COMPONENTS, query) : undefined;
  return (
    <Screen isAmbient>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {found === undefined
          ? STRINGS.hint
          : found.length === 0
            ? STRINGS.empty(query)
            : STRINGS.results(found.length)}
      </Text>
      {found && found.length > 0 ? <PageGallery pages={found} onOpen={openPage} /> : null}
    </Screen>
  );
}
