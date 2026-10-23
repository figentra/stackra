/**
 * Stackra file contract:
 * Purpose: every page's scroll container; automatic insets let content scroll under the glass header and tab bar.
 * Boundary: presentation only.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 14).
 */
import type { ReactNode } from "react";
import { ScrollView } from "react-native";

/** Props of {@link Screen}. */
export interface ScreenProps {
  /** The page's content. */
  children: ReactNode;
}

/** Every page's scroll container. `automatic` insets let content scroll under the glass header and tab bar. */
export function Screen({ children }: ScreenProps) {
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
