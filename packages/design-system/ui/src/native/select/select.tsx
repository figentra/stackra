/**
 * Stackra file contract:
 * Purpose: the native `Select` on HeroUI Native's Select: draws the shared contract (`items`, `label`, `description`,
 *          `errorMessage`, `placeholder`, `isFullWidth` and the field props) as HeroUI Native's label, trigger, overlay
 *          and content, maps the key in and out as a string (`value` is the chosen key, which HeroUI Native holds as a
 *          `{ value, label }` option), and passes every other HeroUI Native Select prop through.
 * Boundary: no styling of its own beyond one `self-start` utility that keeps a field from filling its parent unless
 *          `isFullWidth` says so, as on web. HeroUI Native's Select has no read-only state, so a read-only field is one
 *          that never opens, and no invalid state, so `isInvalid` reaches the label, the description and the error but
 *          the trigger is neither drawn nor announced as invalid (the error text carries it). The list opens as a popover by default; `presentation` picks a bottom sheet or a dialog,
 *          and is given to both the root and the content, which HeroUI Native requires to agree. A field without a
 *          visible `label` names itself with `accessibilityLabel`, which passes through.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI Native on native); ADR 0055 (one field contract); owner
 *          decision 6 of STA-350 (thin wrappers).
 */
import type { ReactElement } from "react";
import { cn, Description, FieldError, Label, Select as HeroSelect } from "heroui-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { SelectItem } from "#contracts/types/select-item.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { SelectProps } from "#native/select/select.props";

/** The option HeroUI Native holds for a key: its key and label, or nothing when no choice has that key. */
function optionOf(items: readonly SelectItem[], key: string | null | undefined) {
  const item = items.find((candidate) => candidate.id === key);
  return item ? { value: item.id, label: item.label } : undefined;
}

/** One choice drawn as an item: its label and an optional description under it, then the selected check. */
function SelectOption({ item }: { readonly item: SelectItem }) {
  return (
    // `disabled`, the Pressable prop: the item has no `isDisabled`, whatever HeroUI Native's page says.
    <HeroSelect.Item value={item.id} label={item.label} disabled={item.isDisabled ?? false}>
      {item.description ? (
        <>
          <HeroSelect.ItemLabel />
          <HeroSelect.ItemDescription>{item.description}</HeroSelect.ItemDescription>
          <HeroSelect.ItemIndicator />
        </>
      ) : undefined}
    </HeroSelect.Item>
  );
}

/**
 * A field that picks one key from a short list. The value is the chosen key, or `null` for nothing; `onChange` is
 * called with the key as a string. A read-only field shows its value but never opens.
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
  // Taken out of `rest` because the root and its content must be given the same one.
  presentation = "popover",
  className,
  ...rest
}: SelectProps): ReactElement {
  // Owner decision 2026-10-24: every native sheet is HeroUI Native's inset style, detached and clear of the home bar.
  const insets = useSafeAreaInsets();
  return (
    <HeroSelect
      {...rest}
      className={cn(isFullWidth ? undefined : "self-start", className) ?? ""}
      presentation={presentation}
      {...omitUndefined({ isDisabled })}
      // `null` and `undefined` are both "no key": HeroUI Native then runs the field uncontrolled and clears it.
      {...omitUndefined({
        value: optionOf(items, value),
        defaultValue: optionOf(items, defaultValue),
      })}
      onValueChange={(option) => onChange?.(option?.value ?? null)}
      {...(isReadOnly ? { isOpen: false } : {})}
    >
      {label ? (
        <Label {...omitUndefined({ isRequired, isInvalid, isDisabled })}>{label}</Label>
      ) : null}
      <HeroSelect.Trigger>
        <HeroSelect.Value {...omitUndefined({ placeholder })} />
        <HeroSelect.TriggerIndicator />
      </HeroSelect.Trigger>
      {description ? (
        <Description {...omitUndefined({ isInvalid, isDisabled })}>{description}</Description>
      ) : null}
      {errorMessage ? (
        <FieldError {...omitUndefined({ isInvalid })}>{errorMessage}</FieldError>
      ) : null}
      <HeroSelect.Portal>
        <HeroSelect.Overlay />
        {/* The popover is as wide as the field, as on web; a sheet or a dialog sizes itself. */}
        <HeroSelect.Content
          presentation={presentation}
          {...(presentation === "popover" ? { width: "trigger" as const } : {})}
          {...(presentation === "bottom-sheet"
            ? {
                detached: true,
                bottomInset: insets.bottom + 12,
                className: "mx-4",
                backgroundClassName: "rounded-4xl",
              }
            : {})}
        >
          {items.map((item) => (
            <SelectOption key={item.id} item={item} />
          ))}
        </HeroSelect.Content>
      </HeroSelect.Portal>
    </HeroSelect>
  );
}
