/**
 * Stackra file contract:
 * Purpose: the web `InlineSelect`: the chosen word inside a sentence, accent-coloured with a small chevron, that opens
 *          its list in a popover ("Show [10] per page").
 * Boundary: React Aria's Select, so the trigger is a button named by `label` and its value, the list a list box,
 *           and focus, typeahead and Escape behave as in any select. It sits on the text baseline and wraps with it.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC 2.1.1,
 *          4.1.2.
 */
import { cn } from "@heroui/react";
import { useState, type ReactElement } from "react";
import { Button, ListBox, ListBoxItem, Popover, Select, SelectValue } from "react-aria-components";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Icon } from "#react/icon/icon";
import type { InlineSelectProps } from "#react/inline-select/inline-select.props";

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
  const [own, setOwn] = useState(defaultValue ?? items[0]?.id ?? null);
  const key = value ?? own;
  return (
    <Select
      aria-label={label}
      selectedKey={key}
      onSelectionChange={(next) => {
        if (next === null) return;
        if (value === undefined) setOwn(String(next));
        onChange?.(String(next));
      }}
      {...omitUndefined({ isDisabled })}
      className="inline"
    >
      <Button
        className={
          cn(
            "inline-flex items-baseline gap-0.5 rounded-md px-0.5 font-medium text-accent-soft-foreground underline decoration-dotted underline-offset-4 outline-none hover:decoration-solid focus-visible:outline-2 focus-visible:outline-focus disabled:text-muted",
            className,
          ) ?? ""
        }
      >
        <SelectValue />
        <Icon name="chevron-down" size="sm" className="self-center" />
      </Button>
      <Popover className="min-w-(--trigger-width) rounded-xl bg-overlay p-1 text-overlay-foreground shadow-lg outline-none">
        <ListBox items={items} className="max-h-72 overflow-y-auto outline-none">
          {(item) => (
            <ListBoxItem
              id={item.id}
              textValue={item.label}
              isDisabled={item.isDisabled ?? false}
              className={({ isFocused, isSelected, isDisabled: off }) =>
                cn(
                  "flex min-h-9 cursor-pointer items-center rounded-lg px-3 text-sm outline-none",
                  isFocused && "bg-default",
                  isSelected && "font-semibold text-accent-soft-foreground",
                  off && "opacity-40",
                ) ?? ""
              }
            >
              {item.label}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </Select>
  );
}
