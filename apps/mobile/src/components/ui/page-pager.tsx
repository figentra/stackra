/**
 * Stackra file contract:
 * Purpose: the previous and next pages at the foot of a design-system page, the native twin of the web playground's
 *          `page-pager`: in gallery order across every category, as two glass cards, so a reviewer walks the whole
 *          system without going back to the gallery. A card settles a little under the finger, unless motion is
 *          reduced.
 * Boundary: presses only; the caller navigates. The first page has no previous, the last no next.
 * Runtime: react-native
 * Governing contract: ADR 0320 (glass and the showcase stage); WCAG 2.2 SC 2.4.8.
 */
import { Icon, Surface, Text } from "@stackra/ui/native";
import { Pressable, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import type { DesignSystemComponentRoute } from "#src/navigation/types";
import type { PageLink } from "#src/types/page-link.type";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  previous: "Previous",
  next: "Next",
  label: (direction: string, title: string) => `${direction}: ${title}`,
} as const;

/** Props of {@link PagePager}. */
export interface PagePagerProps {
  /** Every page, in gallery order. */
  pages: readonly PageLink[];
  /** The page on screen. */
  current: PageLink;
  /** Opens a page. */
  onOpen: (route: DesignSystemComponentRoute) => void;
}

/** One card of the pager: the direction above the page title, aligned to its own edge. */
function PagerCard({
  page,
  isNext,
  onOpen,
}: {
  page: PageLink;
  isNext: boolean;
  onOpen: PagePagerProps["onOpen"];
}) {
  const isReducedMotion = useReducedMotion();
  const direction = isNext ? STRINGS.next : STRINGS.previous;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={STRINGS.label(direction, page.title)}
      onPress={() => onOpen(page.route)}
      className="flex-1"
      style={({ pressed }) =>
        pressed && !isReducedMotion ? { transform: [{ scale: 0.98 }] } : undefined
      }
    >
      <Surface
        className="rounded-2xl p-3.5"
        style={{ gap: 2, alignItems: isNext ? "flex-end" : "flex-start" }}
      >
        <View className="flex-row items-center gap-1">
          {isNext ? null : <Icon name="arrow-left" size="sm" tone="muted" isMirroredInRtl />}
          <Text type="caption" tone="muted">
            {direction}
          </Text>
          {isNext ? <Icon name="arrow-right" size="sm" tone="muted" isMirroredInRtl /> : null}
        </View>
        <Text numberOfLines={1} className="font-semibold">
          {page.title}
        </Text>
      </Surface>
    </Pressable>
  );
}

/** The previous and next page cards. */
export function PagePager({ pages, current, onOpen }: PagePagerProps) {
  const at = pages.findIndex((page) => page.route === current.route);
  const previous = at > 0 ? pages[at - 1] : undefined;
  const next = at >= 0 ? pages[at + 1] : undefined;
  return (
    <View className="flex-row gap-3">
      {previous ? (
        <PagerCard page={previous} isNext={false} onOpen={onOpen} />
      ) : (
        <View className="flex-1" />
      )}
      {next ? <PagerCard page={next} isNext onOpen={onOpen} /> : <View className="flex-1" />}
    </View>
  );
}
