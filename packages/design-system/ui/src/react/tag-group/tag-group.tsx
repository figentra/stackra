/**
 * Stackra file contract:
 * Purpose: the web `TagGroup` on HeroUI v3's TagGroup: draws the shared contract (`items`, `selectionMode`, `size`,
 *          `variant`, `emptyMessage`, the field props, `onRemove` and `removeLabel`) as HeroUI's label, tag list, tags
 *          and remove buttons, keeps the selected keys as a list of strings, and passes every other HeroUI TagGroup prop
 *          through.
 * Boundary: no styling of its own; the look is HeroUI's, themed by `@stackra/tokens`. React Aria's tag group has no
 *          disabled, read-only or invalid state, so they are built here: disabled disables every tag, read-only turns
 *          selection and removal off, and invalid colours the label and shows the error message in place of the
 *          description. A group without a `label` names itself with `aria-label`, which passes through. With a `name`,
 *          one hidden input per selected key submits the selection.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0055 (one field contract);
 *          owner decision 6 of STA-350 (thin wrappers).
 */
import { Description, Label, Tag, TagGroup as HeroTagGroup } from "@heroui/react";
import { useId, useState } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { TagGroupProps } from "#react/tag-group/tag-group.props";

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
  name,
  ...rest
}: TagGroupProps) {
  // The group always runs controlled: React Aria hands back `Set`s, and a list of strings is the contract's value.
  const [own, setOwn] = useState<readonly string[]>(defaultValue ?? []);
  const selected = value ?? own;
  const buttonIds = useId();
  return (
    <>
      <HeroTagGroup
        {...rest}
        {...omitUndefined({ size, variant })}
        selectionMode={isReadOnly ? "none" : selectionMode}
        selectedKeys={new Set(selected)}
        onSelectionChange={(keys) => {
          const next = keys === "all" ? items.map((item) => item.id) : [...keys].map(String);
          setOwn(next);
          onChange?.(next);
        }}
        disabledKeys={items.filter((item) => isDisabled || item.isDisabled).map((item) => item.id)}
        {...(onRemove && !isReadOnly
          ? { onRemove: (keys: Set<unknown>) => onRemove([...keys].map(String)) }
          : {})}
      >
        {label ? (
          // `aria-disabled` as well as the disabled look: a disabled group's label is exempt from contrast, but only
          // a checker that reads it on the label itself can tell, because the grid is not a native control.
          <Label
            {...omitUndefined({ isRequired, isInvalid, isDisabled })}
            {...(isDisabled ? { "aria-disabled": true } : {})}
          >
            {label}
          </Label>
        ) : null}
        <HeroTagGroup.List
          items={items}
          renderEmptyState={() => (emptyMessage === undefined ? null : <span>{emptyMessage}</span>)}
        >
          {(item) => (
            <Tag id={item.id} textValue={item.label}>
              {item.label}
              {removeLabel ? ( // A button that labels itself is read by its `aria-label` alone: React Aria's own
                // `aria-labelledby` adds the tag's text after it, which would say the tag twice here.
                <Tag.RemoveButton
                  id={`${buttonIds}-${item.id}`}
                  aria-label={removeLabel(item.label)}
                  aria-labelledby={`${buttonIds}-${item.id}`}
                />
              ) : null}
            </Tag>
          )}
        </HeroTagGroup.List>
        {/* The error takes the description's place while invalid, as in HeroUI's own fields. */}
        {isInvalid ? (
          errorMessage ? (
            <Description slot="errorMessage" className="text-danger">
              {errorMessage}
            </Description>
          ) : null
        ) : description ? (
          <Description>{description}</Description>
        ) : null}
      </HeroTagGroup>
      {/* Outside the group: its children are also built once into a hidden tree, which would submit twice. */}
      {name && !isDisabled && selectionMode !== "none"
        ? selected.map((key) => <input key={key} type="hidden" name={name} value={key} />)
        : null}
    </>
  );
}
