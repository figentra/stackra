/**
 * Stackra file contract:
 * Purpose: the previous and next entries of the category at the foot of the Docs tab, as two solid cards; a sibling
 *          hop is shown in place (`setParams`), never a replace, so the header capsule never re-mounts.
 * Boundary: presses only; the caller navigates. The first entry has no previous, the last no next.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) sections 1 and 4 (row 12); WCAG 2.2 SC 2.4.8.
 */
import type { I18nKey } from "@stackra/i18n";
import { type ComponentEntry, componentKeys, neighbours } from "@stackra/showcase";
import { Icon, Surface, Text, useCatalogueText } from "@stackra/ui/native";
import { Pressable, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import type { DocPagerProps } from "#src/components/doc-screen/doc-pager.props";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";

/** The pager words' keys. */
const K = SHOWCASE_KEYS.showcase.pager;

/** One card of the pager: the direction above the entry title, aligned to its own edge. */
function PagerCard({
  entry,
  isNext,
  onOpen,
}: {
  readonly entry: ComponentEntry;
  readonly isNext: boolean;
  readonly onOpen: DocPagerProps["onOpen"];
}) {
  const t = useCatalogueText(MESSAGES.en);
  const isReducedMotion = useReducedMotion();
  const direction = t(isNext ? K.next : K.previous);
  const title = t(componentKeys(entry).title as I18nKey);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onOpen(entry)}
      className="flex-1"
      style={({ pressed }) =>
        pressed && !isReducedMotion ? { transform: [{ scale: 0.98 }] } : undefined
      }
    >
      <Surface className={isNext ? "items-end gap-0.5 p-3.5" : "items-start gap-0.5 p-3.5"}>
        <View className="flex-row items-center gap-1">
          {isNext ? null : <Icon name="arrow-left" size="sm" tone="muted" />}
          <Text type="caption" tone="muted">
            {direction}
          </Text>
          {isNext ? <Icon name="arrow-right" size="sm" tone="muted" /> : null}
        </View>
        <Text numberOfLines={1} className="font-semibold">
          {title}
        </Text>
      </Surface>
    </Pressable>
  );
}

/** The previous and next entry cards. */
export function DocPager({ entry, onOpen }: DocPagerProps) {
  const { previous, next } = neighbours(entry, "native");
  if (!previous && !next) return null;
  return (
    <View className="flex-row gap-3">
      {previous ? (
        <PagerCard entry={previous} isNext={false} onOpen={onOpen} />
      ) : (
        <View className="flex-1" />
      )}
      {next ? <PagerCard entry={next} isNext onOpen={onOpen} /> : <View className="flex-1" />}
    </View>
  );
}
