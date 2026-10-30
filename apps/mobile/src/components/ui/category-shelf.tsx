/**
 * Stackra file contract:
 * Purpose: one category's shelf on the phone's "All" page: a header row (the category's brand glyph, its name over its
 *          count, and "View all", which opens its page), then a horizontally swipeable row of big component cards,
 *          85% of the screen wide with the next one peeking, snapping card by card. The row follows the layout
 *          direction, so it runs right to left in Arabic.
 * Boundary: presentation and the presses only; the caller navigates. The words are `showcase::` keys.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 3.3; STA-1371 (listing by width, 2026-10-28).
 */
import type { I18nKey } from "@stackra/i18n";
import { categoryKeys, entryKey } from "@stackra/showcase";
import { haptics, Heading, Link, Text, useCatalogueText } from "@stackra/ui/native";
import { useThemeColor } from "heroui-native";
import { FlatList, useWindowDimensions, View } from "react-native";

import { HOME_KEYS } from "#src/constants/home-keys.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { BrandGlyph } from "./brand-glyph";
import { categoryGlyph } from "./category-glyph.function";
import type { CategoryShelfProps } from "./category-shelf.props";
import { ComponentCard } from "./component-card";

/** The showcase chrome's keys. */
const K = HOME_KEYS.showcase;

/** The row's inset and the gap between cards, in points. */
const INSET = 16;
const GAP = 12;

/** One category's header and swipeable cards. */
export function CategoryShelf({
  category,
  entries,
  onOpen,
  onOpenCategory,
  previewOf,
}: CategoryShelfProps) {
  const t = useCatalogueText(MESSAGES.en);
  const accent = useThemeColor("accent");
  const { width } = useWindowDimensions();
  const cardWidth = Math.round(width * 0.85);
  const keys = categoryKeys(category);
  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-3 px-4">
        <View className="size-10 items-center justify-center">
          <BrandGlyph name={categoryGlyph(category)} color={accent} size={28} />
        </View>
        <View className="flex-1">
          <Heading level={2} type="h4" numberOfLines={1}>
            {t(keys.title as I18nKey)}
          </Heading>
          <Text type="small" tone="muted">
            {t(K.ui.count_components, { count: entries.length })}
          </Text>
        </View>
        <Link
          tone="accent"
          underline="hover"
          onPress={() => {
            haptics.play("selection");
            onOpenCategory(category);
          }}
        >
          {t(K.ui.view_all)}
        </Link>
      </View>
      <FlatList
        horizontal
        data={entries}
        keyExtractor={entryKey}
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        initialNumToRender={2}
        contentContainerStyle={{ paddingHorizontal: INSET, gap: GAP }}
        renderItem={({ item }) => (
          <ComponentCard
            entry={item}
            width={cardWidth}
            onPress={onOpen}
            preview={previewOf?.(item)}
          />
        )}
      />
    </View>
  );
}
