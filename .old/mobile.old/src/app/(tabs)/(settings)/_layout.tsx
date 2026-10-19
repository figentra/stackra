import { Stack } from "expo-router";

import { useTabHeaderOptions } from "@/components/tab-stack";

export default function SettingsStack() {
  return (
    <Stack screenOptions={useTabHeaderOptions()}>
      <Stack.Screen name="index" options={{ title: "Settings" }} />
    </Stack>
  );
}
