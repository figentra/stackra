import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useThemeColor } from "heroui-native";

/** System tab bar: Liquid Glass on iOS 26, Material on Android, a sidebar on iPadOS 18+. */
export default function TabsLayout() {
  const [tint, idle] = useThemeColor(["accent", "muted"]);
  return (
    <NativeTabs
      minimizeBehavior="never"
      sidebarAdaptable
      tintColor={tint}
      iconColor={{ default: idle, selected: tint }}
    >
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(settings)">
        <NativeTabs.Trigger.Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
          md="settings"
        />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
