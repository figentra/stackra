/**
 * Stackra file contract:
 * Purpose: the root native stack: the tab shell and the item route pushed over it. Part of the hand-written
 *          navigation that gen replaces (STA-339).
 * Boundary: the stack and its screens; the pages come from `src/routes/`.
 * Runtime: react-native
 * Governing contract: ADR 0295 (decision 12); ADR 0294 (decision 14).
 */
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { Item } from "#src/routes/item/item";

import { glassHeader } from "./header-options";
import { TabNavigator } from "./tab-navigator";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

/** The root native stack: the tabs, and the item route pushed over them. */
export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={glassHeader}>
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="Item"
        component={Item}
        options={({ route }) => ({ title: `Item ${route.params.id}` })}
      />
    </Stack.Navigator>
  );
}
