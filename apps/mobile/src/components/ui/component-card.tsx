/**
 * Stackra file contract:
 * Purpose: the component card of the mobile showcase, the native twin of the web `component-card`: a solid surface
 *          with the live 16:10 thumbnail on top (`PreviewFrame`: inert, readable; the category glyph until the entry
 *          has a native demo), then the title with its status chip and a "Web only" chip when the entry has no native
 *          side, and one line of description. A press settles the card a little (not under reduced motion), plays a
 *          light tap and hands the entry to the caller. It fills its grid cell, or takes the width a shelf gives it.
 * Boundary: presentation and the press only; the caller navigates. The words are `showcase::` keys.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) sections 5 and 8; ADR 0320 (glass and the showcase stage);
 *          STA-1371 (readable thumbnails, 2026-10-28).
 */
import type { I18nKey } from "@stackra/i18n";
import { componentKeys } from "@stackra/showcase";
import { Chip, haptics, Surface, Text, useCatalogueText } from "@stackra/ui/native";
import { useThemeColor } from "heroui-native";
import { Pressable, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { HOME_KEYS } from "#src/constants/home-keys.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { BrandGlyph } from "./brand-glyph";
import { categoryGlyph } from "./category-glyph.function";
import type { ComponentCardProps } from "./component-card.props";
import { PreviewFrame } from "./preview-frame";

/** The showcase chrome's keys. */
const K = HOME_KEYS.showcase;

/** One component of the registry as a card. */
export function ComponentCard({ entry, width, onPress, preview }: ComponentCardProps) {
  const t = useCatalogueText(MESSAGES.en);
  const accent = useThemeColor("accent");
  const isReducedMotion = useReducedMotion();
  const title = t(componentKeys(entry).title as I18nKey);
  const only = entry.platforms.length === 1 ? entry.platforms[0] : undefined;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        haptics.play("impact");
        onPress?.(entry);
      }}
      style={({ pressed }) => [
        width === undefined ? { flex: 1 } : { width },
        pressed && !isReducedMotion ? { transform: [{ scale: 0.98 }] } : undefined,
      ]}
    >
      <Surface className="flex-1 overflow-hidden p-0">
        {preview === undefined ? (
          <View
            className="items-center justify-center bg-surface-secondary"
            style={{ aspectRatio: 16 / 10 }}
          >
            <BrandGlyph name={categoryGlyph(entry.category)} color={accent} size={32} />
          </View>
        ) : (
          <PreviewFrame>{preview}</PreviewFrame>
        )}
        <View className="gap-1 p-3">
          <View className="flex-row flex-wrap items-center gap-1.5">
            <Text numberOfLines={1} className="shrink font-semibold">
              {title}
            </Text>
            {entry.status ? (
              <Chip size="sm" variant="soft">
                {t(K.status[entry.status])}
              </Chip>
            ) : null}
            {only ? (
              <Chip size="sm" variant="soft">
                {t(K.platform_only[only])}
              </Chip>
            ) : null}
          </View>
          <Text type="small" tone="muted" numberOfLines={1}>
            {t(componentKeys(entry).description as I18nKey)}
          </Text>
        </View>
      </Surface>
    </Pressable>
  );
}
