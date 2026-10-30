/**
 * Stackra file contract:
 * Purpose: the web `CheckboxButtonGroup`: any number of choices, each a card with its title, a line under it and a
 *          square mark; picked cards take the accent tint.
 * Boundary: React Aria's CheckboxGroup and Checkbox, so each card is a real checkbox (Space toggles, the group's label
 *           and error are announced). Stacked by default, side by side and wrapping when `horizontal`.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0055; WCAG 2.2
 *          SC 1.3.1, 2.1.1, 4.1.2.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";
import { Checkbox, CheckboxGroup, FieldError, Label, Text } from "react-aria-components";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { ChoiceCard } from "#react/checkbox-button-group/choice-card";
import { choiceCardClass } from "#react/checkbox-button-group/choice-card-class.function";
import type { CheckboxButtonGroupProps } from "#react/checkbox-button-group/checkbox-button-group.props";

/** Choices drawn as cards, any number picked. */
export function CheckboxButtonGroup({
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
}: CheckboxButtonGroupProps): ReactElement {
  return (
    <CheckboxGroup
      {...omitUndefined(field)}
      {...omitUndefined({
        value: value && [...value],
        defaultValue: defaultValue && [...defaultValue],
        onChange,
      })}
      className={cn("flex flex-col gap-2", className) ?? ""}
    >
      {label ? <Label className="text-sm font-medium text-foreground">{label}</Label> : null}
      <div
        className={
          cn("flex gap-2", orientation === "vertical" ? "flex-col" : "flex-row flex-wrap") ?? ""
        }
      >
        {items.map((item) => (
          <Checkbox
            key={item.id}
            value={item.id}
            isDisabled={item.isDisabled ?? false}
            className={choiceCardClass}
          >
            {({ isSelected }) => <ChoiceCard item={item} isSelected={isSelected} mark="checkbox" />}
          </Checkbox>
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
    </CheckboxGroup>
  );
}
