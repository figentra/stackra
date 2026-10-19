import type { ReactNode } from "react";
import { ScrollView } from "react-native";

/** Every screen's scroll container. `automatic` insets let content scroll under the glass header and tab bar. */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background"
      contentContainerClassName="gap-6 px-4 pb-16 pt-2"
    >
      {children}
    </ScrollView>
  );
}
