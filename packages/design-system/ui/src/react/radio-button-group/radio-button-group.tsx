/**
 * Stackra file contract:
 * Purpose: the web `RadioButtonGroup`: one choice from a few, each a card with its title, a line under it and a round
 *          mark; the picked card takes the accent tint.
 * Boundary: React Aria's RadioGroup and Radio, so arrow keys move between cards (mirrored in right-to-left) and the
 *           group's label and error are announced.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0055; WCAG 2.2
 *          SC 1.3.1, 2.1.1, 4.1.2.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";
import { FieldError, Label, Radio, RadioGroup, Text } from "react-aria-components";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { ChoiceCard } from "#react/checkbox-button-group/choice-card";
import { choiceCardClass } from "#react/checkbox-button-group/choice-card-class.function";
import type { RadioButtonGroupProps } from "#react/radio-button-group/radio-button-group.props";

/** Choices drawn as cards, one picked. */
export function RadioButtonGroup({
  items,
  label,
  description,
  errorMessage,
  orientation = "vertical",
  value,
  defaultValue,
  onChange,
  className,
  ...field
}: RadioButtonGroupProps): ReactElement {
  return (
    <RadioGroup
      {...omitUndefined(field)}
      {...omitUndefined({ value, defaultValue })}
      orientation={orientation}
      onChange={(next) => onChange?.(next || null)}
      className={cn("flex flex-col gap-2", className) ?? ""}
    >
      {label ? <Label className="text-sm font-medium text-foreground">{label}</Label> : null}
      <div
        className={
          cn("flex gap-2", orientation === "vertical" ? "flex-col" : "flex-row flex-wrap") ?? ""
        }
      >
        {items.map((item) => (
          <Radio
            key={item.id}
            value={item.id}
            isDisabled={item.isDisabled ?? false}
            className={choiceCardClass}
          >
            {({ isSelected }) => <ChoiceCard item={item} isSelected={isSelected} mark="radio" />}
          </Radio>
        ))}
      </div>
      {description ? (
        <Text slot="description" className="text-xs text-muted">
          {description}
        </Text>
      ) : null}
      {errorMessage ? (
        <FieldError className="text-xs text-danger">{errorMessage}</FieldError>
      ) : null}
    </RadioGroup>
  );
}
