/**
 * Stackra file contract:
 * Purpose: the tab shell, with one native stack per tab so each tab root gets its large title.
 * Boundary: the tabs and their stacks; the screens themselves come from `../screens`.
 * Runtime: react-native
 * Governing contract: ADR 0007 (documentation).
 */
import { createNativeBottomTabNavigator } from "@bottom-tabs/react-navigation";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useThemeColor } from "heroui-native";

import { HomeScreen } from "../screens/home-screen";
import { SettingsScreen } from "../screens/settings-screen";
import { largeTitleHeader } from "./header-options";
import type { HomeStackParamList, SettingsStackParamList, TabParamList } from "./types";

const Tabs = createNativeBottomTabNavigator<TabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

// Each tab owns a native stack so its root gets a large title under the glass header.
function HomeTab() {
  return (
    <HomeStack.Navigator screenOptions={largeTitleHeader}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
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

/** System tab bar (UITabBarController): Liquid Glass on iOS 26, Material on Android. */
export function TabNavigator() {
  const [accent] = useThemeColor(["accent"]);
  return (
    <Tabs.Navigator tabBarActiveTintColor={accent} sidebarAdaptable>
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
