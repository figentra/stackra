/**
 * Stackra file contract:
 * Purpose: the native `PromptSuggestions`: suggested prompts as Surface cards (an icon, a title and a muted line), compact
 *          without a line; choosing one calls `onSelect` with it. They wrap onto more lines or keep one line
 *          that scrolls sideways.
 * Boundary: each is a button named by its title; the sideways line follows the layout direction (it starts at the right
 *           in Arabic).
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.5.8, 4.1.2; STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ReactElement } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { AI_CHAT_KEYS } from "#core/constants/ai-chat-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import type { PromptSuggestionsProps } from "#native/prompt-suggestions/prompt-suggestions.props";
import { SlotIcon } from "#native/slot-icon/slot-icon";
import { Surface } from "#native/surface/surface";
import { Text } from "#native/text/text";

/** Suggested prompts to start or continue a conversation. */
export function PromptSuggestions({
  suggestions,
  onSelect,
  layout = "wrap",
  label,
  isDisabled = false,
  className,
}: PromptSuggestionsProps): ReactElement {
  const t = useUiText();
  const name = label ?? t(AI_CHAT_KEYS.ui.prompt_suggestions.label);
  const chips = suggestions.map((suggestion) => (
    <Pressable
      key={suggestion.id}
      accessibilityRole="button"
      accessibilityLabel={
        suggestion.description ? `${suggestion.title}, ${suggestion.description}` : suggestion.title
      }
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={() => onSelect(suggestion)}
      className={`min-h-11 active:opacity-70 ${suggestion.description ? "max-w-64" : ""} ${isDisabled ? "opacity-50" : ""}`}
    >
      <Surface
        className={`flex-row gap-2 border border-border shadow-none ${
          suggestion.description ? "items-start px-3 py-2.5" : "items-center px-3 py-2"
        }`}
      >
        {suggestion.icon ? <SlotIcon icon={suggestion.icon} /> : null}
        <View className="shrink gap-0.5">
          <Text type="small" className="font-medium">
            {suggestion.title}
          </Text>
          {suggestion.description ? (
            <Text type="caption" tone="muted">
              {suggestion.description}
            </Text>
          ) : null}
        </View>
      </Surface>
    </Pressable>
  ));
  return layout === "scroll" ? (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={name}
      contentContainerClassName="gap-2"
      {...(className ? { className } : {})}
    >
      {chips}
    </ScrollView>
  ) : (
    <View accessibilityLabel={name} className={`flex-row flex-wrap gap-2 ${className ?? ""}`}>
      {chips}
    </View>
  );
}
