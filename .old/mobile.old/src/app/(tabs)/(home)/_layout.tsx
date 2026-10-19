import { Stack } from "expo-router";

import { useTabHeaderOptions } from "@/components/tab-stack";

export default function HomeStack() {
  return (
    <Stack screenOptions={useTabHeaderOptions()}>
      <Stack.Screen name="index" options={{ title: "Home" }} />
    </Stack>
  );
}
