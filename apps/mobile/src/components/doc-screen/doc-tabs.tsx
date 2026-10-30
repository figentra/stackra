/**
 * Stackra file contract:
 * Purpose: the tab pages of the mobile component screen on @stackra/ui's `Tabs`: a scrolling tab row over the page on
 *          screen, tapped to switch (the Tabs play the selection haptic).
 * Boundary: the tabs and the page switch only; the pages' content and the selected page are the caller's. The Tabs
 *           draw the row only (empty panels); the page is drawn here so it can fill the screen.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 3.3 (Component screen) and section 8 (haptics);
 *          ADR 0461 (core shows free components only).
 */
import { Tabs } from "@stackra/ui/native";
import { View } from "react-native";

import type { DocPage } from "#src/components/doc-screen/doc-page.type";
import type { DocTabsProps } from "#src/components/doc-screen/doc-tabs.props";

/** Tabs over the page on screen. */
export function DocTabs({ pages, page, onPageChange, label }: DocTabsProps) {
  const current = pages.find((item) => item.id === page) ?? pages[0];
  return (
    <View className="flex-1">
      <View className="px-4">
        <Tabs
          label={label}
          items={pages.map((item) => ({ id: item.id, label: item.label, content: null }))}
          selectedKeys={[page]}
          onSelectionChange={([next]) => {
            if (next !== undefined && next !== page) onPageChange(next as DocPage);
          }}
        />
      </View>
      <View className="flex-1">{current?.content}</View>
    </View>
  );
}
