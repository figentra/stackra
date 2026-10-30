/**
 * Stackra file contract:
 * Purpose: the group card of the showcase home's "All" page on a tablet or wider, the native twin of the web
 *          `group-card`: one readable 16:10 thumbnail of its first entry with a native demo (inert; the glyph until one
 *          exists), then the category's brand glyph, title and count ("17 components") and its one-line
 *          description. A press settles the card a little (not under reduced motion), plays a light tap and hands
 *          the category to the caller, who switches the page to it.
 * Boundary: presentation and the press only. The words are `showcase::` keys.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) sections 3.3 and 5; ADR 0320 (glass and the showcase stage);
 *          STA-1371 (readable thumbnails, 2026-10-28).
 */
import type { I18nKey } from "@stackra/i18n";
import { categoryKeys } from "@stackra/showcase";
import { haptics, Heading, Surface, Text, useCatalogueText } from "@stackra/ui/native";
import { useThemeColor } from "heroui-native";
import { Pressable, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { HOME_KEYS } from "#src/constants/home-keys.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { BrandGlyph } from "./brand-glyph";
import { categoryGlyph } from "./category-glyph.function";
import type { GroupCardProps } from "./group-card.props";
import { PreviewFrame } from "./preview-frame";

/** The showcase chrome's keys. */
const K = HOME_KEYS.showcase;

/** One category as a card. */
export function GroupCard({ category, entries, onPress, previewOf }: GroupCardProps) {
  const t = useCatalogueText(MESSAGES.en);
  const accent = useThemeColor("accent");
  const isReducedMotion = useReducedMotion();
  const glyph = categoryGlyph(category);
  const keys = categoryKeys(category);
  const preview = entries.map((entry) => previewOf?.(entry)).find(Boolean);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        haptics.play("impact");
        onPress(category);
      }}
      style={({ pressed }) => [
        { flex: 1 },
        pressed && !isReducedMotion ? { transform: [{ scale: 0.98 }] } : undefined,
      ]}
    >
      <Surface className="flex-1 overflow-hidden p-0">
        {preview === undefined ? (
          <View
            className="items-center justify-center bg-surface-secondary"
            style={{ aspectRatio: 16 / 10 }}
          >
            <BrandGlyph name={glyph} color={accent} size={32} />
          </View>
        ) : (
          <PreviewFrame>{preview}</PreviewFrame>
        )}
        <View className="gap-1 p-3">
          <View className="flex-row items-center gap-2">
            <BrandGlyph name={glyph} color={accent} size={18} />
            <View className="flex-1">
              <Heading level={3} type="h4" numberOfLines={1}>
                {t(keys.title as I18nKey)}
              </Heading>
            </View>
            <Text type="caption" tone="muted">
              {t(K.ui.count_components, { count: entries.length })}
            </Text>
          </View>
          <Text type="small" tone="muted" numberOfLines={1}>
            {t(keys.description as I18nKey)}
          </Text>
        </View>
      </Surface>
    </Pressable>
  );
}
