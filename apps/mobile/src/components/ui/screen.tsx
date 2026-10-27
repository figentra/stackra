/**
 * Stackra file contract:
 * Purpose: the scroll container every screen renders into, so the layout and the safe-area insets live in one place.
 *          A screen can sit on the ambient field (the design-system landing), and a wrapper can add chrome above and
 *          below the content through `ScreenChrome` (the category strip and the pager of a design-system page), so
 *          the pages themselves stay unchanged.
 * Boundary: scroll layout only; no data and no navigation.
 * Runtime: react-native
 * Governing contract: ADR 0007 (documentation); ADR 0320 (glass and the showcase stage).
 */
import { use } from "react";
import { ScrollView, View } from "react-native";

import { Ambient } from "./ambient";
import type { ScreenProps } from "./screen.props";
import { ScreenChrome } from "./screen-chrome.context";

/** Every screen's scroll container. `automatic` insets let content scroll under the glass header and tab bar. */
export function Screen({ children, ref, isAmbient = false }: ScreenProps) {
  const { top, bottom } = use(ScreenChrome);
  const scroll = (
    <ScrollView
      ref={ref}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      className={isAmbient ? "flex-1" : "flex-1 bg-background"}
      contentContainerClassName="gap-6 px-4 pb-16 pt-2"
    >
      {top}
      {children}
      {bottom}
    </ScrollView>
  );
  if (!isAmbient) return scroll;
  return (
    <View className="flex-1">
      <Ambient />
      {scroll}
    </View>
  );
}
