/**
 * Stackra file contract:
 * Purpose: the web `Select` on HeroUI v3's Select: draws the shared contract (`items`, `label`, `description`,
 *          `errorMessage`, `placeholder`, `isFullWidth` and the field props) as HeroUI's label, trigger, popover and
 *          list box, maps the key in and out as a string, and passes every other HeroUI Select prop through.
 * Boundary: no styling of its own; the look is HeroUI's, themed by `@stackra/tokens`. A field that edits one key from a
 *          short list; a long or searchable list is a ComboBox. A field without a `label` names itself with
 *          `aria-label`, which passes through.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0055 (one field contract);
 *          owner decision 6 of STA-350 (thin wrappers).
 */
import {
  Description,
  FieldError,
  Label,
  ListBox,
  Select as HeroSelect,
  type SelectRootProps,
} from "@heroui/react";
import type { KeyboardEvent } from "react";
import { Text } from "react-aria-components";

import type { SelectContractProps } from "#contracts/types/select-contract-props.type";
import type { SelectItem } from "#contracts/types/select-item.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the web Select: the shared contract plus HeroUI v3's own select props, passed through unchanged. HeroUI's
 * `fullWidth` is the contract's `isFullWidth`; the app lists choices as `items`, never as children.
 */
export type SelectProps = SelectContractProps &
  Omit<SelectRootProps<SelectItem>, keyof SelectContractProps | "children" | "items" | "fullWidth">;

/** One choice drawn as a list box item: its label, an optional description under it and the selected check. */
function SelectOption({ item }: { readonly item: SelectItem }) {
  return (
    <ListBox.Item id={item.id} textValue={item.label} isDisabled={item.isDisabled ?? false}>
      {item.description ? (
        <div className="flex flex-col">
          <Text slot="label">{item.label}</Text>
          <Description>{item.description}</Description>
        </div>
      ) : (
        item.label
      )}
      <ListBox.ItemIndicator />
    </ListBox.Item>
  );
}

/** Stops the keys that would change a closed Select's value: the arrows and any printable character (type-ahead). */
function refuseChangingKey(event: KeyboardEvent<HTMLElement>) {
  const isPrintable = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
  if (isPrintable || event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.stopPropagation();
    event.preventDefault();
  }
}

/**
 * A field that picks one key from a short list. The value is the chosen key, or `null` for nothing; `onChange` is
 * called with the key as a string. A read-only field shows its value but never opens or changes, by pointer or keyboard.
 */
export function Select({
  items,
  label,
  description,
  errorMessage,
  placeholder,
  isFullWidth,
  isRequired,
  isInvalid,
  isDisabled,
  isReadOnly,
  value,
  defaultValue,
  onChange,
  name,
  ...rest
}: SelectProps) {
  return (
    // React Aria's Select has no read-only state: its closed trigger still picks a key from ArrowLeft, ArrowRight and
    // type-ahead. The capture handler stops those keys before they reach it; `contents` keeps the wrapper out of layout.
    <div className="contents" onKeyDownCapture={isReadOnly ? refuseChangingKey : undefined}>
    <HeroSelect
      {...rest}
      {...omitUndefined({
        placeholder,
        isRequired,
        isInvalid,
        isDisabled,
        value,
        defaultValue,
        name,
      })}
      fullWidth={isFullWidth ?? false}
      // A list that cannot open shows the value and keeps focus, and the hidden select still submits it.
      {...(isReadOnly ? { isOpen: false } : {})}
      // `Key` is a string or number in React Aria; the contract's keys are strings, so the number case never arises.
      onChange={(key) => {
        if (!isReadOnly) onChange?.(key === null ? null : String(key));
      }}
    >
      {label ? <Label>{label}</Label> : null}
      <HeroSelect.Trigger>
        {/* The label alone: the item's own content would repeat its description and check mark in the field. */}
        <HeroSelect.Value>
          {({ isPlaceholder, selectedText, defaultChildren }) =>
            isPlaceholder ? defaultChildren : selectedText
          }
        </HeroSelect.Value>
        <HeroSelect.Indicator />
      </HeroSelect.Trigger>
      {description ? <Description>{description}</Description> : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
      <HeroSelect.Popover>
        <ListBox>
          {items.map((item) => (
            <SelectOption key={item.id} item={item} />
          ))}
        </ListBox>
      </HeroSelect.Popover>
    </HeroSelect>
    </div>
  );
}
