/**
 * Stackra file contract:
 * Purpose: the native `Listbox`: an always-visible list of options in a bordered box, one or several chosen with a
 *          checkmark each, optionally under section headings, under a label.
 * Boundary: each option is a 44-point row read with its state (selected for one, checked for several); a selection
 *           haptic on each press. The checkmark sits at the reading end and the rows mirror in right-to-left.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.5.8 and 4.1.2; STA-1371.
 */
import { useState, type ReactElement } from "react";
import { Pressable, View } from "react-native";

import type { SelectItem } from "#contracts/types/select-item.type";
import { haptics } from "#native/haptics/haptics";
import { Icon } from "#native/icon/icon";
import type { ListboxProps } from "#native/listbox/listbox.props";
import { Text } from "#native/text/text";

/** The `items` default, one array for every render. */
const NO_ITEMS: NonNullable<ListboxProps["items"]> = [];

/** An always-visible list of options. */
export function Listbox({
  items = NO_ITEMS,
  sections,
  selectionMode = "single",
  label,
  ariaLabel,
  description,
  value,
  defaultValue,
  onChange,
  isDisabled,
  className,
}: ListboxProps): ReactElement {
  const [own, setOwn] = useState<readonly string[]>(defaultValue ?? []);
  const chosen = value ?? own;
  const isMultiple = selectionMode === "multiple";
  const press = (id: string) => {
    haptics.play("selection");
    const next = isMultiple
      ? chosen.includes(id)
        ? chosen.filter((key) => key !== id)
        : [...chosen, id]
      : [id];
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  const option = (item: SelectItem) => {
    const isOn = chosen.includes(item.id);
    const isOff = Boolean(isDisabled || item.isDisabled);
    return (
      <Pressable
        key={item.id}
        disabled={isOff}
        onPress={() => press(item.id)}
        accessibilityRole={isMultiple ? "checkbox" : "radio"}
        accessibilityLabel={item.description ? `${item.label}, ${item.description}` : item.label}
        accessibilityState={
          isMultiple ? { checked: isOn, disabled: isOff } : { selected: isOn, disabled: isOff }
        }
        className={`min-h-11 flex-row items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 ${isOn ? "bg-accent-soft" : ""} ${isOff ? "opacity-50" : ""}`}
      >
        <View className="flex-1">
          <Text className={isOn ? "text-accent-soft-foreground" : ""}>{item.label}</Text>
          {item.description ? (
            <Text type="small" tone="muted">
              {item.description}
            </Text>
          ) : null}
        </View>
        {isOn ? <Icon name="check" tone="accent" /> : null}
      </Pressable>
    );
  };
  return (
    <View className={`gap-1.5 ${className ?? ""}`}>
      {label == null ? null : <Text className="font-medium">{label}</Text>}
      <View
        accessibilityRole={isMultiple ? "list" : "radiogroup"}
        accessibilityLabel={typeof label === "string" ? label : ariaLabel}
        className="rounded-[var(--radius-container)] border border-separator p-1"
      >
        {sections
          ? sections.map((section) => (
              <View key={section.id}>
                <Text
                  type="small"
                  tone="muted"
                  accessibilityRole="header"
                  className="px-3 pt-2 pb-1"
                >
                  {section.title}
                </Text>
                {section.items.map(option)}
              </View>
            ))
          : items.map(option)}
      </View>
      {description == null ? null : (
        <Text type="small" tone="muted">
          {description}
        </Text>
      )}
    </View>
  );
}
