/**
 * Stackra file contract:
 * Purpose: the native `CheckboxButtonGroup`: any number of choices, each a card that toggles with a square mark.
 * Boundary: the cards and frame are ChoiceCard's and ChoiceGroupFrame's; read-only and disabled refuse presses.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0055.
 */
import { useState, type ReactElement } from "react";

import { ChoiceCard } from "#native/checkbox-button-group/choice-card";
import { ChoiceGroupFrame } from "#native/checkbox-button-group/choice-group-frame";
import type { CheckboxButtonGroupProps } from "#native/checkbox-button-group/checkbox-button-group.props";

/** Choices drawn as cards, any number picked. */
export function CheckboxButtonGroup({
  items,
  orientation = "vertical",
  value,
  defaultValue,
  onChange,
  isDisabled,
  isReadOnly,
  ...frame
}: CheckboxButtonGroupProps): ReactElement {
  const [own, setOwn] = useState<readonly string[]>(defaultValue ?? []);
  const keys = value ?? own;
  return (
    <ChoiceGroupFrame {...frame} orientation={orientation} role="list">
      {items.map((item) => (
        <ChoiceCard
          key={item.id}
          item={item}
          mark="checkbox"
          isWide={orientation === "horizontal"}
          isSelected={keys.includes(item.id)}
          isDisabled={Boolean(isDisabled)}
          onPress={() => {
            if (isReadOnly) return;
            const next = keys.includes(item.id)
              ? keys.filter((key) => key !== item.id)
              : [...keys, item.id];
            if (value === undefined) setOwn(next);
            onChange?.(next);
          }}
        />
      ))}
    </ChoiceGroupFrame>
  );
}
