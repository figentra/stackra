/**
 * Stackra file contract:
 * Purpose: the native `RadioButtonGroup`: one choice from a few, each a card with a round mark.
 * Boundary: the cards and frame are ChoiceCard's and ChoiceGroupFrame's (a `radiogroup`); read-only and disabled
 *           refuse presses.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0055.
 */
import { useState, type ReactElement } from "react";

import { ChoiceCard } from "#native/checkbox-button-group/choice-card";
import { ChoiceGroupFrame } from "#native/checkbox-button-group/choice-group-frame";
import type { RadioButtonGroupProps } from "#native/radio-button-group/radio-button-group.props";

/** Choices drawn as cards, one picked. */
export function RadioButtonGroup({
  items,
  orientation = "vertical",
  value,
  defaultValue,
  onChange,
  isDisabled,
  isReadOnly,
  ...frame
}: RadioButtonGroupProps): ReactElement {
  const [own, setOwn] = useState(defaultValue ?? null);
  const key = value === undefined ? own : value;
  return (
    <ChoiceGroupFrame {...frame} orientation={orientation} role="radiogroup">
      {items.map((item) => (
        <ChoiceCard
          key={item.id}
          item={item}
          mark="radio"
          isWide={orientation === "horizontal"}
          isSelected={key === item.id}
          isDisabled={Boolean(isDisabled)}
          onPress={() => {
            if (isReadOnly || key === item.id) return;
            if (value === undefined) setOwn(item.id);
            onChange?.(item.id);
          }}
        />
      ))}
    </ChoiceGroupFrame>
  );
}
