/**
 * Stackra file contract:
 * Purpose: the native `InlineSelect`: the chosen word in the accent with a small chevron, inside a sentence, that
 *          opens HeroUI Native's Select popover of the choices.
 * Boundary: the trigger is read as a button named by `label` and valued by the chosen word; the list is HeroUI
 *           Native's.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2.
 */
import { Select as HeroSelect } from "heroui-native";
import { useState, type ReactElement } from "react";
import { View } from "react-native";

import { Icon } from "#native/icon/icon";
import { Text } from "#native/text/text";
import type { InlineSelectProps } from "#native/inline-select/inline-select.props";

/** A select drawn as a word in a sentence. */
export function InlineSelect({
  items,
  label,
  value,
  defaultValue,
  onChange,
  isDisabled,
  className,
}: InlineSelectProps): ReactElement {
  const [own, setOwn] = useState(defaultValue ?? items[0]?.id);
  const key = value ?? own;
  const chosen = items.find((item) => item.id === key);
  return (
    <HeroSelect
      className={`self-start ${className ?? ""}`}
      isDisabled={isDisabled ?? false}
      {...(chosen ? { value: { value: chosen.id, label: chosen.label } } : {})}
      onValueChange={(option) => {
        if (!option) return;
        if (value === undefined) setOwn(option.value);
        onChange?.(option.value);
      }}
    >
      <HeroSelect.Trigger
        accessibilityLabel={label}
        accessibilityValue={{ text: chosen?.label ?? "" }}
      >
        <View className="flex-row items-center gap-0.5">
          <Text tone={isDisabled ? "muted" : "accent"} className="font-medium underline">
            {chosen?.label ?? ""}
          </Text>
          <Icon name="chevron-down" size="sm" tone={isDisabled ? "muted" : "accent"} />
        </View>
      </HeroSelect.Trigger>
      <HeroSelect.Portal>
        <HeroSelect.Overlay />
        <HeroSelect.Content presentation="popover" width={220}>
          {items.map((item) => (
            <HeroSelect.Item
              key={item.id}
              value={item.id}
              label={item.label}
              disabled={item.isDisabled ?? false}
            />
          ))}
        </HeroSelect.Content>
      </HeroSelect.Portal>
    </HeroSelect>
  );
}
