/**
 * Stackra file contract:
 * Purpose: the tab shell, with one native stack per tab so each tab root gets its large title.
 * Boundary: the tabs and their stacks; the screens themselves come from `../screens`.
 * Runtime: react-native
 * Governing contract: ADR 0007 (documentation).
 */
import { createNativeBottomTabNavigator } from "@bottom-tabs/react-navigation";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useDesignSystem } from "@stackra/ui/native";
import { useThemeColor } from "heroui-native";

import { DESIGN_SYSTEM_COMPONENTS } from "../screens/design-system-components";
import { DesignSystemScreen } from "../screens/design-system-screen";
import { HomeScreen } from "../screens/home-screen";
import { SettingsScreen } from "../screens/settings-screen";
import { detailHeader, largeTitleHeader } from "./header-options";
import type { HomeStackParamList, SettingsStackParamList, TabParamList } from "./types";

// Release builds leave the review area out of the bundle: Metro folds `__DEV__` to false and drops these requires,
// where static imports would bundle and evaluate all its screens and their native libraries at start-up.
/* oxlint-disable typescript/no-require-imports -- the requires are what lets the release build drop the area */
const DESIGN_SYSTEM_COMPONENTS: typeof import("../screens/design-system-components").DESIGN_SYSTEM_COMPONENTS =
  __DEV__ ? require("../screens/design-system-components").DESIGN_SYSTEM_COMPONENTS : [];
const DesignSystemScreen:
  | typeof import("../screens/design-system-screen").DesignSystemScreen
  | undefined = __DEV__ ? require("../screens/design-system-screen").DesignSystemScreen : undefined;
const ComponentPage: typeof import("../components/ui/component-page").ComponentPage | undefined =
  __DEV__ ? require("../components/ui/component-page").ComponentPage : undefined;
const DisplaySettings:
  | typeof import("../components/ui/display-settings").DisplaySettings
  | undefined = __DEV__ ? require("../components/ui/display-settings").DisplaySettings : undefined;
/* oxlint-enable typescript/no-require-imports */

const Tabs = createNativeBottomTabNavigator<TabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

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
              headerRight: () => <DisplaySettings />,
            }}
          />
          {DESIGN_SYSTEM_COMPONENTS.map(({ route, title, screen }) => (
            <HomeStack.Screen
              key={route}
              name={route}
              component={screen}
              options={{ ...detailHeader, title, headerRight: () => <DisplaySettings /> }}
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
      {/* Development builds only, like the Settings row that opens it. */}
      {__DEV__ ? (
        <>
          <SettingsStack.Screen
            name="DesignSystem"
            component={DesignSystemScreen}
            options={{ ...detailHeader, title: "Design system" }}
          />
          {DESIGN_SYSTEM_COMPONENTS.map(({ route, title, screen }) => (
            <SettingsStack.Screen
              key={route}
              name={route}
              component={screen}
              options={{ ...detailHeader, title }}
            />
          ))}
        </>
      ) : null}
    </SettingsStack.Navigator>
  );
}

/** System tab bar (UITabBarController): Liquid Glass on iOS 26, Material on Android. */
export function TabNavigator() {
  const [accent] = useThemeColor(["accent"]);
  // The in-app locale's direction, not the device's (`locale`, the default), so the switcher mirrors the tab bar.
  const { direction } = useDesignSystem();
  return (
    <Tabs.Navigator tabBarActiveTintColor={accent} sidebarAdaptable layoutDirection={direction}>
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
    </Tabs.Navigator>
  );
}
