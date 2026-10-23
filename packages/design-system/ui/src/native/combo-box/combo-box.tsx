/**
 * Stackra file contract:
 * Purpose: the native `ComboBox`, the ADAPTED form: HeroUI Native has no ComboBox, so it is built from its free parts, a
 *          Select whose list opens as a bottom sheet with a SearchField above a FlatList. It draws the shared contract
 *          (`items`, the field props, the typed text, `isServerFiltered`, `isLoading`, `onLoadMore` and `emptyMessage`)
 *          as HeroUI Native's label, trigger, sheet, search field and items, maps keys in and out as strings, one key
 *          or a list in multiple mode, and passes every other HeroUI Native Select prop through.
 * Boundary: no styling of its own beyond one `self-start` utility that keeps a field from filling its parent unless
 *          `isFullWidth` says so, and one maximum height that bounds the list inside a sheet that sizes itself to its
 *          content. The text filters the list with a case- and accent-insensitive "contains" unless the app filters
 *          (`isServerFiltered`); it is cleared when the sheet closes unless the app controls it. A sheet has no inline
 *          text field, so `allowsCustomValue` and `menuTrigger` do not exist here, and the picked choices of multiple
 *          mode show as the trigger's text, not as tags. A read-only field is one that never opens. A field without a
 *          visible `label` names itself with `accessibilityLabel`, which passes through.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI Native on native); ADR 0055 (one field contract); owner
 *          decision 6 of STA-350 (thin wrappers); the component catalogue, row ComboBox ("build on HN Select +
 *          SearchField in BottomSheet").
 */
import {
  cn,
  Description,
  FieldError,
  Label,
  SearchField,
  Select as HeroSelect,
  type SelectRootProps,
} from "heroui-native";
import { useState } from "react";
import { FlatList } from "react-native";

import type { ComboBoxContractProps } from "#contracts/types/combo-box-contract-props.type";
import type { SelectItem } from "#contracts/types/select-item.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Spinner } from "#native/spinner/spinner";
import { Text } from "#native/text/text";

/**
 * Props of the native ComboBox: the shared contract plus HeroUI Native's own select props, passed through unchanged.
 * HeroUI's `value`, `defaultValue` and `onValueChange` are the contract's `value`, `defaultValue` and `onChange`, in
 * keys instead of options; the app lists choices as `items`, never as children.
 */
export type ComboBoxProps = ComboBoxContractProps &
  Omit<
    SelectRootProps,
    keyof ComboBoxContractProps | "children" | "value" | "defaultValue" | "onValueChange"
  >;

/** The list's bound: the sheet sizes itself to its content, so a long list needs a height to scroll inside. */
const LIST_STYLE = Object.freeze({ maxHeight: 320 });

/** Text as compared when filtering: without accents or case, so "cafe" finds "Café". */
const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase();

/** The option HeroUI Native holds for a key: its key and label, or nothing when no choice has that key. */
function optionOf(items: readonly SelectItem[], key: string | null | undefined) {
  const item = items.find((candidate) => candidate.id === key);
  return item ? { value: item.id, label: item.label } : undefined;
}

/** One choice drawn as an item: its label and an optional description under it, then the selected check. */
function ComboBoxOption({
  item,
  isMultiple,
}: {
  readonly item: SelectItem;
  readonly isMultiple: boolean;
}) {
  return (
    // `disabled`, the Pressable prop: the item has no `isDisabled`, whatever HeroUI Native's page says. In multiple mode
    // a press toggles the choice and the sheet stays open.
    <HeroSelect.Item
      value={item.id}
      label={item.label}
      disabled={item.isDisabled ?? false}
      closeOnPress={!isMultiple}
    >
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
 * A field that picks from a list narrowed by the text typed into a search field in a sheet: one key, or several in
 * multiple mode. The value is the chosen key (`null` for nothing) or the list of keys; `onChange` is called with strings.
 */
export function ComboBox({
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
  inputValue,
  onInputChange,
  isServerFiltered,
  isLoading,
  loadingLabel,
  onLoadMore,
  emptyMessage,
  selectionMode,
  value,
  defaultValue,
  onChange,
  onOpenChange,
  // A form adapter binds the field by its name; the field submits nothing itself.
  name: _name,
  className,
  ...rest
}: ComboBoxProps) {
  const [ownText, setOwnText] = useState("");
  const text = inputValue ?? ownText;
  const isMultiple = selectionMode === "multiple";
  const shown =
    isServerFiltered || text.trim() === ""
      ? items
      : items.filter((item) => fold(item.label).includes(fold(text.trim())));
  // Two shapes, one element: `selectionMode` tells the key and the list of keys apart, and the cast keeps TypeScript
  // from choosing HeroUI Native's generic by the mode, which it cannot see through a spread.
  const selection: object = isMultiple
    ? omitUndefined({
        selectionMode,
        value: value?.map((key) => optionOf(items, key)).filter((option) => option !== undefined),
        defaultValue: defaultValue
          ?.map((key) => optionOf(items, key))
          .filter((option) => option !== undefined),
        onValueChange: (options: readonly ({ value: string } | undefined)[]) =>
          onChange?.(options.flatMap((option) => (option ? [option.value] : []))),
      })
    : omitUndefined({
        value: optionOf(items, value as string | null | undefined),
        defaultValue: optionOf(items, defaultValue as string | null | undefined),
        onValueChange: (option: { value: string } | undefined) =>
          (onChange as ((next: string | null) => void) | undefined)?.(option?.value ?? null),
      });
  const setText = (next: string) => {
    setOwnText(next);
    onInputChange?.(next);
  };
  return (
    <HeroSelect
      {...rest}
      className={cn(isFullWidth ? undefined : "self-start", className) ?? ""}
      presentation="bottom-sheet"
      {...omitUndefined({ isDisabled })}
      {...selection}
      {...(isReadOnly ? { isOpen: false } : {})}
      onOpenChange={(open) => {
        // The text is a means of finding a choice, so a closed sheet starts the next search clean.
        if (!open) setText("");
        onOpenChange?.(open);
      }}
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
        <HeroSelect.Content presentation="bottom-sheet">
          {label ? <HeroSelect.ListLabel>{label}</HeroSelect.ListLabel> : null}
          <SearchField value={text} onChange={setText}>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input
                {...omitUndefined({ placeholder })}
                accessibilityLabel={typeof label === "string" ? label : (placeholder ?? "")}
              />
            </SearchField.Group>
          </SearchField>
          <FlatList
            style={LIST_STYLE}
            data={shown}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            renderItem={({ item }) => <ComboBoxOption item={item} isMultiple={isMultiple} />}
            {...omitUndefined({ onEndReached: onLoadMore })}
            ListEmptyComponent={
              emptyMessage === undefined || isLoading ? null : (
                <Text tone="muted" className="p-3 text-sm">
                  {emptyMessage}
                </Text>
              )
            }
            ListFooterComponent={
              isLoading ? (
                <Spinner size="sm" tone="muted" {...omitUndefined({ label: loadingLabel })} />
              ) : null
            }
          />
        </HeroSelect.Content>
      </HeroSelect.Portal>
    </HeroSelect>
  );
}
