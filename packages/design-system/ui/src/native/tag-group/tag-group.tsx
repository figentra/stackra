/**
 * Stackra file contract:
 * Purpose: the native `TagGroup` on HeroUI Native's TagGroup: draws the shared contract (`items`, `selectionMode`,
 *          `size`, `variant`, `emptyMessage`, the field props, `onRemove` and `removeLabel`) as HeroUI Native's label,
 *          list, items and remove buttons, keeps the selected keys as a list of strings, and passes every other HeroUI
 *          Native TagGroup prop through.
 * Boundary: no styling of its own. HeroUI Native's group has no read-only state, so read-only turns selection and
 *          removal off; its disabled, invalid and required states reach the label, the description and the error through
 *          the group's own context. The description gives way to the error while the group is invalid. A group without a
 *          visible `label` names itself with `accessibilityLabel`, which passes through; a remove button is named from
 *          `removeLabel`, because HeroUI Native gives it no name. `name` binds a form adapter and submits nothing on its
 *          own.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI Native on native); ADR 0055 (one field contract); owner
 *          decision 6 of STA-350 (thin wrappers).
 */
import { Description, FieldError, Label, TagGroup as HeroTagGroup } from "heroui-native";
import type { ComponentPropsWithRef } from "react";
import { useState } from "react";

import type { TagGroupContractProps } from "#contracts/types/tag-group-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Text } from "#native/text/text";

/**
 * Props of the native TagGroup: the shared contract plus HeroUI Native's own tag group props, passed through
 * unchanged. The app lists tags as `items`, and the selection is the contract's `value`, never HeroUI's selected keys.
 */
export type TagGroupProps = TagGroupContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroTagGroup>,
    | keyof TagGroupContractProps
    | "children"
    | "selectedKeys"
    | "defaultSelectedKeys"
    | "onSelectionChange"
    | "disabledKeys"
  >;

/**
 * A row of tags that can be selected and removed. The value is the list of selected keys; `onChange` is called with the
 * new list, and `onRemove` with the keys of the tags the user removed, which the app then drops from `items`.
 */
export function TagGroup({
  items,
  selectionMode = "none",
  size,
  variant,
  emptyMessage,
  onRemove,
  removeLabel,
  label,
  description,
  errorMessage,
  isRequired,
  isInvalid,
  isDisabled,
  isReadOnly,
  value,
  defaultValue,
  onChange,
  // A form adapter binds the field by its name; the group submits nothing itself.
  name: _name,
  ...rest
}: TagGroupProps) {
  // The group always runs controlled: HeroUI Native hands back `Set`s, and a list of strings is the contract's value.
  const [own, setOwn] = useState<readonly string[]>(defaultValue ?? []);
  const selected = value ?? own;
  return (
    <HeroTagGroup
      {...rest}
      {...omitUndefined({ size, variant, isDisabled, isInvalid, isRequired })}
      selectionMode={isReadOnly ? "none" : selectionMode}
      selectedKeys={selected}
      onSelectionChange={(keys) => {
        const next = [...keys].map(String);
        setOwn(next);
        onChange?.(next);
      }}
      {...(onRemove && !isReadOnly
        ? { onRemove: (keys: Set<string | number>) => onRemove([...keys].map(String)) }
        : {})}
    >
      {label ? <Label>{label}</Label> : null}
      <HeroTagGroup.List
        {...(emptyMessage === undefined
          ? {}
          : {
              // HeroUI Native renders the result straight inside a View, where a bare string is a React Native error.
              renderEmptyState: () =>
                typeof emptyMessage === "string" ? (
                  <Text tone="muted" className="p-3 text-sm">
                    {emptyMessage}
                  </Text>
                ) : (
                  emptyMessage
                ),
            })}
      >
        {items.map((item) => (
          <HeroTagGroup.Item key={item.id} id={item.id} isDisabled={item.isDisabled ?? false}>
            <HeroTagGroup.ItemLabel>{item.label}</HeroTagGroup.ItemLabel>
            {removeLabel ? (
              <HeroTagGroup.ItemRemoveButton accessibilityLabel={removeLabel(item.label)} />
            ) : null}
          </HeroTagGroup.Item>
        ))}
      </HeroTagGroup.List>
      {description ? <Description hideOnInvalid>{description}</Description> : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </HeroTagGroup>
  );
}
