/**
 * Stackra file contract:
 * Purpose: the landing of the design-system review area, the native twin of the web playground's index: on the
 *          ambient field, a hero (the stage, an eyebrow, the product name, an intro, its numbers, and the ways in:
 *          Browse scrolls to the gallery, Search focuses the header search), then "In use", three live scenes on glass,
 *          then "Components", the gallery of every page by category with its All / Free / Pro filter. Typing in the
 *          header search (the web's command palette) swaps the landing for the matching pages, grouped the same way.
 *          The display switcher is the header button every page of the area shares.
 * Boundary: presentation, the search query and navigation calls; the pages come in gallery order from
 *          `design-system-components.ts`.
 * Runtime: react-native
 * Governing contract: ADR 0320 (glass and the showcase stage); ADR 0310 (decision 6); ADR 0060 (light, dark, RTL).
 */
import {
  useAnimatedHeaderHeight,
  type NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { Button, Chip, Heading, Text } from "@stackra/ui/native";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Platform, View, type ScrollView } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import type { SearchBarCommands } from "react-native-screens";

import { Glass } from "../components/ui/glass";
import { HeroArt } from "../components/ui/hero-art";
import { PageGallery } from "../components/ui/page-gallery";
import { Screen } from "../components/ui/screen";
import { Showcase } from "../components/ui/showcase";
import type { DesignSystemComponentRoute, SettingsStackParamList } from "../navigation/types";
import type { PageLink } from "../types/page-link.type";
import { DESIGN_SYSTEM_COMPONENTS } from "./design-system-components";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  eyebrow: "Playground",
  brand: "Stackra",
  product: "Design System",
  intro:
    "Every component, live, in light and dark and in English and Arabic. Built on HeroUI and drawn in the Stackra tokens.",
  browse: "Browse components",
  search: "Search",
  stats: {
    pages: (count: number) => `${count} pages`,
    categories: (count: number) => `${count} categories`,
    schemes: "Light and dark",
    directions: "LTR and RTL",
  },
  showcase: "In use",
  showcaseNote: "Three small scenes built only from the system's components. Try them.",
  components: "Components",
  componentsNote: "Every page, grouped by category. Free pages come first; Pro pages wear a badge.",
  searchPlaceholder: "Search components and categories…",
  results: (count: number) => (count === 1 ? "1 match" : `${count} matches`),
  empty: (query: string) => `Nothing matches “${query}”.`,
} as const;

const STATS = [
  STRINGS.stats.pages(DESIGN_SYSTEM_COMPONENTS.length),
  STRINGS.stats.categories(new Set(DESIGN_SYSTEM_COMPONENTS.map((page) => page.category)).size),
  STRINGS.stats.schemes,
  STRINGS.stats.directions,
];

/** The pages whose title, category or tier contains every word of `query`, ignoring case (the web palette's rule). */
function matching(pages: readonly PageLink[], query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return pages.filter((page) => {
    const text = `${page.title} ${page.category} ${page.tier}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });
}

/** A section heading with its muted note. */
function SectionHeading({ title, note }: { title: string; note: string }) {
  return (
    <View className="gap-1">
      <Heading level={2} type="h3">
        {title}
      </Heading>
      <Text tone="muted">{note}</Text>
    </View>
  );
}

/** The review area's landing: hero, showcase and gallery, or the search results while a query is typed. */
export function DesignSystemScreen({
  navigation,
}: NativeStackScreenProps<SettingsStackParamList, "DesignSystem">) {
  const [query, setQuery] = useState("");
  const scroll = useRef<ScrollView>(null);
  const search = useRef<SearchBarCommands>(null);
  const galleryY = useRef(0);
  const isReducedMotion = useReducedMotion();
  // Every component route takes no params, but navigate's per-route overloads cannot take a union of route names.
  const openPage = navigation.navigate as (route: DesignSystemComponentRoute) => void;

  // iOS draws the content under the transparent header, so a jump to the gallery clears the header's height.
  const headerHeight = useAnimatedHeaderHeight();
  const headerOffset = useRef(0);
  useEffect(() => {
    if (Platform.OS !== "ios") return;
    const id = headerHeight.addListener(({ value }) => (headerOffset.current = value));
    return () => headerHeight.removeListener(id);
  }, [headerHeight]);

  // The web's command palette, as the native search in the header: always shown, so Search can focus it.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        ref: search,
        placeholder: STRINGS.searchPlaceholder,
        hideWhenScrolling: false,
        placement: "stacked",
        onChangeText: (event) => setQuery(event.nativeEvent.text),
        onCancelButtonPress: () => setQuery(""),
      },
    });
  }, [navigation]);

  const found = query.trim() ? matching(DESIGN_SYSTEM_COMPONENTS, query) : undefined;
  if (found)
    return (
      <Screen isAmbient>
        <Text tone="muted" accessibilityLiveRegion="polite">
          {found.length === 0 ? STRINGS.empty(query) : STRINGS.results(found.length)}
        </Text>
        {found.length > 0 ? <PageGallery pages={found} onOpen={openPage} /> : null}
      </Screen>
    );

  return (
    <Screen ref={scroll} isAmbient>
      <View className="items-center gap-5 pt-2">
        <HeroArt />
        <View>
          <Chip variant="soft" size="sm" startIcon="sparkles">
            {STRINGS.eyebrow}
          </Chip>
        </View>
        {/* The stage draws the name as the wordmark, so the heading shows the rest of it and is read whole. */}
        <Heading
          level={1}
          type="h1"
          accessibilityLabel={`${STRINGS.brand} ${STRINGS.product}`}
          className="text-center"
        >
          {STRINGS.product}
        </Heading>
        <Text tone="muted" className="text-lg" style={{ textAlign: "center" }}>
          {STRINGS.intro}
        </Text>
        <View className="flex-row flex-wrap justify-center gap-3">
          <Button
            endIcon="arrow-right"
            onPress={() =>
              scroll.current?.scrollTo({
                y: galleryY.current - headerOffset.current,
                animated: !isReducedMotion,
              })
            }
          >
            {STRINGS.browse}
          </Button>
          <Button variant="outline" startIcon="search" onPress={() => search.current?.focus()}>
            {STRINGS.search}
          </Button>
        </View>
        <View className="flex-row flex-wrap justify-center gap-2">
          {STATS.map((stat) => (
            <Glass
              key={stat}
              radius={999}
              padding={0}
              isInteractive={false}
              style={{ paddingHorizontal: 12, paddingVertical: 4 }}
            >
              <Text type="small">{stat}</Text>
            </Glass>
          ))}
        </View>
      </View>

      <View className="gap-4 pt-6">
        <SectionHeading title={STRINGS.showcase} note={STRINGS.showcaseNote} />
        <Showcase />
      </View>

      <View
        className="gap-4 pt-6"
        onLayout={({ nativeEvent }) => (galleryY.current = nativeEvent.layout.y)}
      >
        <SectionHeading title={STRINGS.components} note={STRINGS.componentsNote} />
        <PageGallery pages={DESIGN_SYSTEM_COMPONENTS} onOpen={openPage} />
      </View>
    </Screen>
  );
}
