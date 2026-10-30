/**
 * Stackra file contract:
 * Purpose: the tab shell, with one native stack per tab so each tab root gets its large title. In development
 *          builds the Home tab roots on the showcase home and holds the ONE `Component` screen (by tier and slug),
 *          and a Search tab (the showcase search) takes the search role, which iOS 26 draws as the search button
 *          beside the tab bar; the tab bar minimizes as the content scrolls down.
 * Boundary: the tabs and their stacks; the screens themselves come from `../screens`.
 * Runtime: react-native
 * Governing contract: ADR 0007 (documentation); showcase redesign spec (2026-10-27) sections 1 and 3.3.
 */
import { createNativeBottomTabNavigator } from "@bottom-tabs/react-navigation";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type {
  NativeStackNavigationOptions,
  NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import { bySlug } from "@stackra/showcase";
import { haptics, useCatalogueText, useDesignSystem, useHaptics } from "@stackra/ui/native";
import { useThemeColor } from "heroui-native";
import { Linking, Platform } from "react-native";

import { BRAND_KEYS } from "../constants/brand-keys.constant";
import { HEROES } from "../constants/heroes.constant";
import { MESSAGES } from "../constants/messages.constant";
import { SHELL_KEYS } from "../constants/shell-keys.constant";
import { SettingsScreen } from "../screens/settings-screen";
import { WelcomeScreen } from "../screens/welcome-screen";
import { heroChoice } from "../stores/hero-choice.store";
import { useHeroChoice } from "../stores/use-hero-choice";
import { numeralsChoice } from "../stores/numerals-choice.store";
import { useNumeralsChoice } from "../stores/use-numerals-choice";
import { componentMenuItems } from "./component-menu-items.function";
import { detailHeader } from "./detail-header.constant";
import { displaySettingsItems } from "./display-settings-items.function";
import { largeTitleHeader } from "./large-title-header.constant";
import { useBarHeader } from "./use-bar-header";
import type { HomeStackParamList } from "./types";
import type { SettingsStackParamList } from "./settings-stack-param-list.type";
import type { SearchStackParamList } from "./search-stack-param-list.type";
import type { TabParamList } from "./tab-param-list.type";
import type { DisplaySettings as DisplaySettingsComponent } from "../components/ui/display-settings";
import type { ComponentScreen as ComponentScreenComponent } from "../screens/component-screen";
import type { HomeScreen as HomeScreenComponent } from "../screens/home-screen";
import type { SearchScreen as SearchScreenComponent } from "../screens/search-screen";

// Release builds leave the showcase out of the bundle: Metro folds `__DEV__` to false and drops these requires,
// where static imports would bundle and evaluate the registry, the demos and their native libraries at start-up
// (the type imports above are erased).
/* oxlint-disable typescript/no-require-imports -- the requires are what lets the release build drop the area */
const HomeScreen: typeof HomeScreenComponent | undefined = __DEV__
  ? require("../screens/home-screen").HomeScreen
  : undefined;
const ComponentScreen: typeof ComponentScreenComponent | undefined = __DEV__
  ? require("../screens/component-screen").ComponentScreen
  : undefined;
const DisplaySettings: typeof DisplaySettingsComponent | undefined = __DEV__
  ? require("../components/ui/display-settings").DisplaySettings
  : undefined;
const SearchScreen: typeof SearchScreenComponent | undefined = __DEV__
  ? require("../screens/search-screen").SearchScreen
  : undefined;
/* oxlint-enable typescript/no-require-imports */

const Tabs = createNativeBottomTabNavigator<TabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();

/** The component screen's navigation, for a sibling hop by `setParams`. */
type ComponentNavigation = NativeStackNavigationProp<HomeStackParamList, "Component">;

/** Opens a link in the browser after the selection tick. */
function openUrl(url: string) {
  haptics.play("selection");
  void Linking.openURL(url);
}

// Each tab owns a native stack so its root gets a large title under the glass header.
function HomeTab() {
  const display = useDesignSystem();
  const hapticsSwitch = useHaptics();
  const t = useCatalogueText(MESSAGES.en);
  const hero = useHeroChoice();
  const bars = useBarHeader();
  const numerals = useNumeralsChoice();
  // Declared ONCE for the whole stack: iOS 26 keeps one Liquid Glass bar-item capsule across pushes instead of
  // re-mounting (and re-animating the width of) a capsule per screen. The component screen adds its ⋯ menu beside
  // the switcher, which keeps its identifier. iOS draws them as native bar items; native-stack falls back to
  // `headerRight` (the React button) on Android, where no glass capsule fades in. Release builds (no showcase) keep
  // the plain large-title header.
  const screenOptions = DisplaySettings
    ? ({
        route,
        navigation,
      }: {
        route: {
          name: keyof HomeStackParamList;
          params?: HomeStackParamList[keyof HomeStackParamList] | undefined;
        };
        navigation: NativeStackNavigationProp<HomeStackParamList, keyof HomeStackParamList>;
      }): NativeStackNavigationOptions => {
        const params =
          route.name === "Component"
            ? (route.params as HomeStackParamList["Component"])
            : undefined;
        const entry = params ? bySlug(params.tier, params.slug) : undefined;
        return {
          ...detailHeader,
          ...bars,
          unstable_headerRightItems: () => [
            ...(entry
              ? componentMenuItems(
                  entry,
                  {
                    openUrl,
                    jumpTo: (target) =>
                      (navigation as ComponentNavigation).setParams({
                        tier: target.tier,
                        slug: target.slug,
                      }),
                  },
                  t,
                )
              : []),
            ...displaySettingsItems(
              display,
              t,
              hapticsSwitch,
              undefined,
              {
                label: t(BRAND_KEYS.brand.hero.menu),
                items: HEROES.map(({ id }) => ({ id, label: t(BRAND_KEYS.brand.hero[id].name) })),
                current: hero,
                onSelect: heroChoice.set,
              },
              {
                items: numeralsChoice.offered.map((id) => ({
                  id,
                  label: t(SHELL_KEYS.shell.numerals[id]),
                })),
                current: numerals,
                onSelect: numeralsChoice.set,
              },
            ),
          ],
          // oxlint-disable-next-line react/no-unstable-nested-components -- a render callback the navigator calls, not a component type
          headerRight: () => <DisplaySettings />,
        };
      }
    : { ...largeTitleHeader, ...bars };
  return (
    <HomeStack.Navigator screenOptions={screenOptions}>
      {HomeScreen && ComponentScreen && DisplaySettings ? (
        <>
          {/* The hero is the page's title and scrolls with the one list, so the header stays transparent (Liquid
              Glass's scroll edge on iOS 26) with no large title; the screen puts its brand in the start slot,
              and the list takes its insets from the system, so nothing sits under the header. */}
          <HomeStack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: t(BRAND_KEYS.brand.name), headerLargeTitle: false }}
          />
          {/* The screen sets its own title from the registry. Its tab row sits above the page, so, as on the home,
              an opaque header keeps it below. */}
          <HomeStack.Screen
            name="Component"
            component={ComponentScreen}
            options={{ headerTransparent: false }}
          />
        </>
      ) : (
        <HomeStack.Screen name="Home" component={WelcomeScreen} />
      )}
    </HomeStack.Navigator>
  );
}

/** The tab titles' keys. */
const TABS = SHELL_KEYS.shell.tabs;

function SettingsTab() {
  const t = useCatalogueText(MESSAGES.en);
  const bars = useBarHeader(true);
  return (
    <SettingsStack.Navigator screenOptions={{ ...largeTitleHeader, ...bars }}>
      <SettingsStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t(TABS.settings) }}
      />
    </SettingsStack.Navigator>
  );
}

function SearchTab() {
  const t = useCatalogueText(MESSAGES.en);
  const bars = useBarHeader(true);
  if (!SearchScreen) return null;
  return (
    <SearchStack.Navigator screenOptions={{ ...largeTitleHeader, ...bars }}>
      <SearchStack.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: t(TABS.search) }}
      />
    </SearchStack.Navigator>
  );
}

/**
 * A tab's icon: the SF Symbol on iOS; Android draws no SF Symbols, so there the Lucide glyph rendered to a PNG in
 * `assets/tabs/` (the system tints it).
 */
const TAB_ICONS = {
  house: require("../../assets/tabs/house.png"),
  gearshape: require("../../assets/tabs/settings.png"),
  magnifyingglass: require("../../assets/tabs/search.png"),
} as const;
const tabIcon = (sfSymbol: keyof typeof TAB_ICONS) => () =>
  Platform.OS === "ios" ? { sfSymbol } : TAB_ICONS[sfSymbol];

/**
 * System tab bar (UITabBarController): Liquid Glass on iOS 26, Material on Android. On iOS 26 it minimizes while the
 * content scrolls down and comes back on scrolling up; the search tab's role sets it apart beside the bar.
 */
export function TabNavigator() {
  const [accent, surface, foreground, muted, soft] = useThemeColor([
    "accent",
    "surface",
    "foreground",
    "muted",
    "accent-soft",
  ]);
  // The in-app locale's direction, not the device's (`locale`, the default), so the switcher mirrors the tab bar.
  const { direction } = useDesignSystem();
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Tabs.Navigator
      tabBarActiveTintColor={accent}
      // Android's Material bar takes the system scheme, not the in-app one, so it is painted from the theme there,
      // the selected tab in the foreground on the soft accent pill as Material 3 does; iOS keeps Liquid Glass.
      {...(Platform.OS === "android"
        ? {
            tabBarActiveTintColor: foreground,
            tabBarStyle: { backgroundColor: surface },
            tabBarInactiveTintColor: muted,
            activeIndicatorColor: soft,
          }
        : {})}
      sidebarAdaptable
      layoutDirection={direction}
      minimizeBehavior="onScrollDown"
    >
      <Tabs.Screen
        name="HomeTab"
        component={HomeTab}
        options={{ title: t(TABS.home), tabBarIcon: tabIcon("house") }}
      />
      <Tabs.Screen
        name="SettingsTab"
        component={SettingsTab}
        options={{ title: t(TABS.settings), tabBarIcon: tabIcon("gearshape") }}
      />
      {SearchScreen ? (
        <Tabs.Screen
          name="SearchTab"
          component={SearchTab}
          options={{
            title: t(TABS.search),
            role: "search",
            tabBarIcon: tabIcon("magnifyingglass"),
          }}
        />
      ) : null}
    </Tabs.Navigator>
  );
}
