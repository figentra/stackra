/**
 * Stackra file contract:
 * Purpose: the native `EmojiPicker`: a search field over a scrolling grid of emoji under category headings (recent
 *          first); a press picks one with a light haptic.
 * Boundary: the set is `EMOJI_SET` and the search `emojiMatches` (English words for now). Each emoji is a 44pt button
 *           named by its words; the headings are headers. No skin tones yet.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2.
 */
import { useState, type ReactElement } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { EMOJI_SET } from "#core/constants/emoji-set.constant";
import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { emojiMatches } from "#core/functions/emoji-matches.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { haptics } from "#native/haptics/haptics";
import { SearchField } from "#native/search-field/search-field";
import { Text } from "#native/text/text";
import type { EmojiPickerProps } from "#native/emoji-picker/emoji-picker.props";

/** The words of each emoji, for its name. */
const WORDS = new Map(
  Object.values(EMOJI_SET)
    .flat()
    .map(({ emoji, words }) => [emoji, words]),
);

/** One section of emoji buttons. */
function Section({
  title,
  emoji,
  onSelect,
}: {
  readonly title: string;
  readonly emoji: readonly string[];
  readonly onSelect: (emoji: string) => void;
}) {
  return (
    <View className="gap-1">
      <Text type="small" tone="muted" accessibilityRole="header">
        {title}
      </Text>
      <View className="flex-row flex-wrap">
        {emoji.map((each) => (
          <Pressable
            key={each}
            accessibilityRole="button"
            accessibilityLabel={WORDS.get(each) ?? each}
            onPress={() => onSelect(each)}
            className="size-11 items-center justify-center rounded-[var(--radius-control)] active:bg-default"
          >
            <Text className="text-2xl">{each}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** The `recent` default, one array for every render. */
const NO_RECENT: NonNullable<EmojiPickerProps["recent"]> = [];

/** A searchable grid of emoji. */
export function EmojiPicker({
  onSelect,
  recent = NO_RECENT,
  label,
  className,
}: EmojiPickerProps): ReactElement {
  const t = useUiText();
  const K = FORMS_KEYS.ui.emoji_picker;
  const [query, setQuery] = useState("");
  const pick = (emoji: string) => {
    haptics.play("light");
    onSelect?.(emoji);
  };
  const found = query.trim() ? emojiMatches(query) : null;
  return (
    <View accessibilityLabel={label ?? t(K.label)} className={`gap-2 ${className ?? ""}`}>
      <SearchField
        accessibilityLabel={t(K.search)}
        placeholder={t(K.search)}
        value={query}
        onChange={setQuery}
      />
      <ScrollView className="max-h-80" contentContainerClassName="gap-3">
        {found ? (
          found.length > 0 ? (
            <Section title={t(K.search)} emoji={found} onSelect={pick} />
          ) : (
            <Text tone="muted" align="center" accessibilityLiveRegion="polite" className="py-6">
              {t(K.no_matches)}
            </Text>
          )
        ) : (
          <>
            {recent.length > 0 ? (
              <Section title={t(K.recent)} emoji={recent} onSelect={pick} />
            ) : null}
            {(Object.keys(EMOJI_SET) as (keyof typeof EMOJI_SET)[]).map((category) => (
              <Section
                key={category}
                title={t(K[category])}
                emoji={EMOJI_SET[category].map(({ emoji }) => emoji)}
                onSelect={pick}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
