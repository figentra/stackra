/**
 * Stackra file contract:
 * Purpose: the tab shell, with one native stack per tab so each tab root gets its large title. In development
 *          builds a Search tab (the review area's search) takes the search role, which iOS 26 draws as the search
 *          button beside the tab bar, and the tab bar minimizes as the content scrolls down.
 * Boundary: the tabs and their stacks; the screens themselves come from `../screens`.
 * Runtime: react-native
 * Governing contract: ADR 0007 (documentation).
 */
import { createNativeBottomTabNavigator } from "@bottom-tabs/react-navigation";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useDesignSystem } from "@stackra/ui/native";
import { useThemeColor } from "heroui-native";

import { HomeScreen } from "../screens/home-screen";
import { SettingsScreen } from "../screens/settings-screen";
import { detailHeader } from "./detail-header.constant";
import { largeTitleHeader } from "./large-title-header.constant";
import type { HomeStackParamList } from "./types";
import type { SettingsStackParamList } from "./settings-stack-param-list.type";
import type { SearchStackParamList } from "./search-stack-param-list.type";
import type { TabParamList } from "./tab-param-list.type";
import type { ComponentPage as ComponentPageComponent } from "../components/ui/component-page";
import type { DisplaySettings as DisplaySettingsComponent } from "../components/ui/display-settings";
import type { DESIGN_SYSTEM_COMPONENTS as DesignSystemComponentsList } from "../screens/design-system-components";
import type { DesignSystemScreen as DesignSystemScreenComponent } from "../screens/design-system-screen";
import type { SearchScreen as SearchScreenComponent } from "../screens/search-screen";

// Release builds leave the review area out of the bundle: Metro folds `__DEV__` to false and drops these requires,
// where static imports would bundle and evaluate all its screens and their native libraries at start-up (the type
// imports above are erased).
/* oxlint-disable typescript/no-require-imports -- the requires are what lets the release build drop the area */
const DESIGN_SYSTEM_COMPONENTS: typeof DesignSystemComponentsList = __DEV__
  ? require("../screens/design-system-components").DESIGN_SYSTEM_COMPONENTS
  : [];
const DesignSystemScreen: typeof DesignSystemScreenComponent | undefined = __DEV__
  ? require("../screens/design-system-screen").DesignSystemScreen
  : undefined;
const ComponentPage: typeof ComponentPageComponent | undefined = __DEV__
  ? require("../components/ui/component-page").ComponentPage
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

// Each tab owns a native stack so its root gets a large title under the glass header.
function HomeTab() {
  return (
    <HomeStack.Navigator screenOptions={largeTitleHeader}>
      {/* Development builds: the design-system landing is the tab's root; release builds show the Home screen. */}
      {/* Each page is framed by its category strip and pager; the display switcher sits in every header. */}
      {DesignSystemScreen && ComponentPage && DisplaySettings ? (
        <>
          <HomeStack.Screen
            name="DesignSystem"
            component={DesignSystemScreen}
            options={{
              ...detailHeader,
              title: "Design system",
              // oxlint-disable-next-line react/no-unstable-nested-components -- a render callback the navigator calls, not a component type
              headerRight: () => <DisplaySettings />,
            }}
          />
          {DESIGN_SYSTEM_COMPONENTS.map(({ route, title, screen }) => (
            <HomeStack.Screen
              key={route}
              name={route}
              component={screen}
              // oxlint-disable-next-line react/no-unstable-nested-components -- a render callback the navigator calls, not a component type
              options={{ ...detailHeader, title, headerRight: () => <DisplaySettings /> }}
              // oxlint-disable-next-line react/no-unstable-nested-components -- a render callback the navigator calls, not a component type
              layout={({ children }) => (
                <ComponentPage pages={DESIGN_SYSTEM_COMPONENTS} route={route}>
                  {children}
                </ComponentPage>
              )}
            />
          ))}
        </>
      ) : (
        <HomeStack.Screen name="Home" component={HomeScreen} />
      )}
    </HomeStack.Navigator>
  );
}

function SettingsTab() {
  return (
    <SettingsStack.Navigator screenOptions={largeTitleHeader}>
      <SettingsStack.Screen name="Settings" component={SettingsScreen} />
    </SettingsStack.Navigator>
  );
}

function SearchTab() {
  if (!SearchScreen) return null;
  return (
    <SearchStack.Navigator screenOptions={largeTitleHeader}>
      <SearchStack.Screen name="Search" component={SearchScreen} />
    </SearchStack.Navigator>
  );
}

/**
 * System tab bar (UITabBarController): Liquid Glass on iOS 26, Material on Android. On iOS 26 it minimizes while the
 * content scrolls down and comes back on scrolling up; the search tab's role sets it apart beside the bar.
 */
export function TabNavigator() {
  const [accent] = useThemeColor(["accent"]);
  // The in-app locale's direction, not the device's (`locale`, the default), so the switcher mirrors the tab bar.
  const { direction } = useDesignSystem();
  return (
    <Tabs.Navigator
      tabBarActiveTintColor={accent}
      sidebarAdaptable
      layoutDirection={direction}
      minimizeBehavior="onScrollDown"
    >
      <Tabs.Screen
        name="HomeTab"
        component={HomeTab}
        options={{ title: "Home", tabBarIcon: () => ({ sfSymbol: "house" }) }}
      />
      <Tabs.Screen
        name="SettingsTab"
        component={SettingsTab}
        options={{ title: "Settings", tabBarIcon: () => ({ sfSymbol: "gearshape" }) }}
      />
      {SearchScreen ? (
        <Tabs.Screen
          name="SearchTab"
          component={SearchTab}
          options={{
            title: "Search",
            role: "search",
            tabBarIcon: () => ({ sfSymbol: "magnifyingglass" }),
          }}
        />
      ) : null}
    </Tabs.Navigator>
  );
}
