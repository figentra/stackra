/**
 * Stackra file contract:
 * Purpose: `ChoiceCard`, one card of the native RadioButtonGroup and CheckboxButtonGroup: a pressable card (icon,
 *          title, muted line, round or square mark at the inline end).
 * Boundary: internal. A card is a radio or a checkbox to VoiceOver and TalkBack with its checked and disabled state;
 *           a press plays a selection haptic.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); WCAG 2.2 SC 4.1.2.
 */
import type { ReactElement } from "react";
import { Pressable, View } from "react-native";

import type { ChoiceItem } from "#contracts/types/choice-item.type";
import { haptics } from "#native/haptics/haptics";
import { Icon } from "#native/icon/icon";
import { Text } from "#native/text/text";

/** Draws one choice card of a button group. */
export function ChoiceCard({
  item,
  isSelected,
  mark,
  isDisabled,
  onPress,
  isWide,
}: {
  readonly item: ChoiceItem;
  readonly isSelected: boolean;
  readonly mark: "radio" | "checkbox";
  readonly isDisabled: boolean;
  readonly onPress: () => void;
  readonly isWide: boolean;
}): ReactElement {
  const off = isDisabled || Boolean(item.isDisabled);
  return (
    <Pressable
      disabled={off}
      onPress={() => {
        haptics.play("selection");
        onPress();
      }}
      accessibilityRole={mark}
      accessibilityLabel={item.label}
      accessibilityHint={item.description}
      accessibilityState={{ checked: isSelected, disabled: off }}
      className={`flex-row items-start gap-3 rounded-[var(--radius-container)] border p-4 ${isWide ? "flex-1" : ""} ${isSelected ? "border-accent bg-accent-soft" : "border-border bg-surface"} ${off ? "opacity-50" : ""}`}
    >
      {item.icon ? <Icon name={item.icon} tone={isSelected ? "accent" : "muted"} /> : null}
      <View className="flex-1 gap-0.5">
        <Text className="font-medium">{item.label}</Text>
        {item.description ? (
          <Text type="small" tone="muted">
            {item.description}
          </Text>
        ) : null}
      </View>
      <View
        className={`size-5 items-center justify-center border-2 ${mark === "radio" ? "rounded-[var(--radius-pill)]" : "rounded-[var(--radius-control)]"} ${isSelected ? "border-accent bg-accent" : "border-border"}`}
      >
        {isSelected ? (
          mark === "radio" ? (
            <View className="size-2 rounded-[var(--radius-pill)] bg-accent-foreground" />
          ) : (
            <Icon name="check" size="sm" />
          )
        ) : null}
      </View>
    </Pressable>
  );
}
