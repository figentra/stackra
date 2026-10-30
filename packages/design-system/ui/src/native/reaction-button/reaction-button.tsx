/**
 * Stackra file contract:
 * Purpose: the native `ReactionButton`: a pill with an emoji and its count that the user toggles; on, it takes the
 *          accent tint. The count is in the customer's digits; a press plays a selection haptic.
 * Boundary: a toggle button to VoiceOver and TalkBack (`checked`), named "<emoji name>: <count>". Controlled, the count
 *           is the caller's; uncontrolled, it adds or removes the user's own 1.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2.
 */
import { withDigits } from "@stackra/i18n";
import { useNumerals } from "@stackra/i18n/react";
import { useState, type ReactElement } from "react";
import { Pressable } from "react-native";

import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { haptics } from "#native/haptics/haptics";
import { Text } from "#native/text/text";
import type { ReactionButtonProps } from "#native/reaction-button/reaction-button.props";

/** An emoji reaction with its count. */
export function ReactionButton({
  emoji,
  count,
  isSelected: controlledSelected,
  defaultSelected = false,
  onChange,
  label,
  isDisabled,
  className,
}: ReactionButtonProps): ReactElement {
  const t = useUiText();
  const { locale } = useDesignSystem();
  const numerals = useNumerals();
  const [ownSelected, setOwnSelected] = useState(defaultSelected);
  const isSelected = controlledSelected ?? ownSelected;
  // Uncontrolled: `count` holds the user's 1 when `defaultSelected`, so the shown count follows the toggle.
  const shown =
    controlledSelected === undefined
      ? count - (defaultSelected ? 1 : 0) + (ownSelected ? 1 : 0)
      : count;
  const toggle = (next: boolean): void => {
    setOwnSelected(next);
    onChange?.(next);
  };
  const number = withDigits(
    new Intl.NumberFormat(locale, { notation: "compact" }).format(shown),
    numerals,
  );
  return (
    <Pressable
      disabled={Boolean(isDisabled)}
      onPress={() => {
        haptics.play("selection");
        toggle(!isSelected);
      }}
      accessibilityRole="togglebutton"
      accessibilityLabel={t(FORMS_KEYS.ui.reaction_button.label, {
        emoji: label ?? emoji,
        count: number,
      })}
      accessibilityState={{ checked: isSelected, disabled: Boolean(isDisabled) }}
      className={`min-h-9 flex-row items-center gap-1.5 self-start rounded-[var(--radius-pill)] border px-3 ${isSelected ? "border-accent bg-accent-soft" : "border-border bg-surface"} ${isDisabled ? "opacity-50" : ""} ${className ?? ""}`}
    >
      <Text>{emoji}</Text>
      <Text type="small" tone={isSelected ? "accent" : "default"}>
        {number}
      </Text>
    </Pressable>
  );
}
