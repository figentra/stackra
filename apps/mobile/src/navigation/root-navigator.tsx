/**
 * Stackra file contract:
 * Purpose: the root native stack, which holds the tab shell and the item detail screen.
 * Boundary: route wiring for the root stack; the tabs and the screens are declared elsewhere.
 * Runtime: react-native
 * Governing contract: ADR 0007 (documentation).
 */
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ItemScreen } from "../screens/item-screen";
import { glassHeader } from "./header-options";
import { TabNavigator } from "./tab-navigator";
import type { RootStackParamList } from "./root-stack-param-list.type";

const Stack = createNativeStackNavigator<RootStackParamList>();

/** The root stack: the tab shell (header hidden) and the item detail, typed by `RootStackParamList`. */
export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={glassHeader}>
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="Item"
        component={ItemScreen}
        options={({ route }) => ({ title: `Item ${route.params.id}` })}
      />
    </Stack.Navigator>
  );
}
