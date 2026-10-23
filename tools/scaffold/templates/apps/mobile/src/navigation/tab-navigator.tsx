/**
 * Stackra file contract:
 * Purpose: the tab shell, with one native stack per tab so each tab root gets its large title. Part of the
 *          hand-written navigation that gen replaces (STA-339).
 * Boundary: the tabs and their stacks; the pages come from `src/routes/`.
 * Runtime: react-native
 * Governing contract: ADR 0295 (decision 12); ADR 0294 (decision 14).
 */
import { createNativeBottomTabNavigator } from "@bottom-tabs/react-navigation";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useThemeColor } from "heroui-native";

import { {{PASCAL}}ChromeConfig } from "#src/config/chrome.config";
import { Home } from "#src/routes/home/home";
import { Settings } from "#src/routes/settings/settings";

import { largeTitleHeader } from "./header-options";
import type { HomeStackParamList, SettingsStackParamList, TabParamList } from "./types";

const Tabs = createNativeBottomTabNavigator<TabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
// shortcut: a fresh instance until the shell mounts config classes (ADR 0295 decision 10, STA-339).
const chrome = new {{PASCAL}}ChromeConfig();

// Each tab owns a native stack so its root gets a large title under the glass header.
function HomeTab() {
  return (
    <HomeStack.Navigator screenOptions={largeTitleHeader}>
      <HomeStack.Screen name="Home" component={Home} />
    </HomeStack.Navigator>
  );
}

function SettingsTab() {
  return (
    <SettingsStack.Navigator screenOptions={largeTitleHeader}>
      <SettingsStack.Screen name="Settings" component={Settings} />
    </SettingsStack.Navigator>
  );
}

/** System tab bar (UITabBarController): Liquid Glass on iOS 26, Material on Android. */
export function TabNavigator() {
  const [accent] = useThemeColor(["accent"]);
  return (
    <Tabs.Navigator tabBarActiveTintColor={accent} sidebarAdaptable={chrome.tabBar.sidebarAdaptable}>
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
