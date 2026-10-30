/**
 * Stackra file contract:
 * Purpose: the Related block of the Docs tab: up to three small cards (title, tier chip, one-line description) that
 *          push the related entry's screen with a selection haptic.
 * Boundary: presses only; the caller navigates. A key no entry matches is skipped.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (row 11) and section 5 (card states).
 */
import type { I18nKey } from "@stackra/i18n";
import { bySlug, type ComponentEntry, componentKeys, type ComponentTier } from "@stackra/showcase";
import { Surface, Text, useCatalogueText, useHaptic } from "@stackra/ui/native";
import { Pressable, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import type { RelatedCardsProps } from "#src/components/doc-screen/related-cards.props";
import { MESSAGES } from "#src/constants/messages.constant";

/** The entry a key names, or undefined. */
function entryOf(key: string): ComponentEntry | undefined {
  const [tier, slug] = key.split("/");
  return tier && slug ? bySlug(tier as ComponentTier, slug) : undefined;
}

/** The related entries as pressable cards. */
export function RelatedCards({ keys, notes, onOpen }: RelatedCardsProps) {
  const t = useCatalogueText(MESSAGES.en);
  const { play } = useHaptic();
  const isReducedMotion = useReducedMotion();
  const entries = keys.map(entryOf).filter((entry) => entry !== undefined);
  return (
    <View className="gap-3">
      {entries.map((entry) => {
        const words = componentKeys(entry);
        return (
          <Pressable
            key={`${entry.tier}/${entry.slug}`}
            accessibilityRole="button"
            accessibilityLabel={t(words.title as I18nKey)}
            onPress={() => {
              play("selection");
              onOpen(entry);
            }}
            style={({ pressed }) =>
              pressed && !isReducedMotion ? { transform: [{ scale: 0.98 }] } : undefined
            }
          >
            <Surface className="gap-1 p-3.5">
              <View className="flex-row items-center gap-2">
                <Text className="font-semibold">{t(words.title as I18nKey)}</Text>
              </View>
              <Text type="small" tone="muted" numberOfLines={notes ? undefined : 1}>
                {notes?.[`${entry.tier}/${entry.slug}`] ?? t(words.description as I18nKey)}
              </Text>
            </Surface>
          </Pressable>
        );
      })}
    </View>
  );
}
