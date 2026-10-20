import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ItemScreen } from "../screens/item-screen";
import { glassHeader } from "./header-options";
import { TabNavigator } from "./tab-navigator";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

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
