/**
 * Stackra file contract:
 * Purpose: the page navigation above a design-system page, the native twin of the web playground's `category-nav`:
 *          a glass strip with a pill back to every component and the pages of the current page's category as pills,
 *          the current one marked (selected to assistive technology, the accent fill and a dot, so not by colour
 *          alone). It scrolls sideways and brings the current pill into view.
 * Boundary: presses only; the caller navigates.
 * Runtime: react-native
 * Governing contract: ADR 0320 (glass and the showcase stage); WCAG 2.2 SC 2.4.8, 1.4.1.
 */
import { Icon, Surface, Text } from "@stackra/ui/native";
import { useThemeColor } from "heroui-native";
import { useRef } from "react";
import { Pressable, ScrollView, View } from "react-native";

import type { DesignSystemComponentRoute } from "#src/navigation/types";
import type { PageLink } from "#src/types/page-link.type";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = { all: "All components" } as const;

/** Props of {@link CategoryStrip}. */
export interface CategoryStripProps {
  /** Every page, in gallery order. */
  pages: readonly PageLink[];
  /** The page on screen. */
  current: PageLink;
  /** Opens a page of the category. */
  onOpen: (route: DesignSystemComponentRoute) => void;
  /** Goes back to the gallery. */
  onOpenAll: () => void;
}

const PILL = "min-h-8 flex-row items-center gap-1.5 rounded-full px-3";

/** The category strip of a design-system page. */
export function CategoryStrip({ pages, current, onOpen, onOpenAll }: CategoryStripProps) {
  const siblings = pages.filter((page) => page.category === current.category);
  const strip = useRef<ScrollView>(null);
  // The text tone has no on-accent value, so the current pill's label takes the role's colour directly.
  const accentForeground = useThemeColor("accent-foreground");

  return (
    <Surface className="rounded-2xl p-1.5">
      <ScrollView
        ref={strip}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="items-center gap-2"
      >
        <Pressable
          accessibilityRole="button"
          onPress={onOpenAll}
          className={`${PILL} active:bg-default`}
        >
          <Icon name="layout-grid" size="sm" tone="muted" />
          <Text type="small" tone="muted">
            {STRINGS.all}
          </Text>
        </Pressable>
        <View className="h-5 w-px bg-separator" />
        <Text type="caption" tone="muted" className="px-2 font-semibold">
          {current.category}
        </Text>
        {siblings.map((page) => {
          const isCurrent = page.route === current.route;
          return (
            <Pressable
              key={page.route}
              accessibilityRole="button"
              accessibilityState={{ selected: isCurrent }}
              disabled={isCurrent}
              onPress={() => onOpen(page.route)}
              // The current pill scrolls into view once laid out.
              onLayout={
                isCurrent
                  ? ({ nativeEvent }) =>
                      strip.current?.scrollTo({ x: nativeEvent.layout.x - 48, animated: false })
                  : undefined
              }
              className={`${PILL} ${isCurrent ? "bg-accent" : "active:bg-default"}`}
            >
              {isCurrent ? <View className="size-1.5 rounded-full bg-accent-foreground" /> : null}
              <Text type="small" style={isCurrent ? { color: accentForeground } : undefined}>
                {page.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </Surface>
  );
}
