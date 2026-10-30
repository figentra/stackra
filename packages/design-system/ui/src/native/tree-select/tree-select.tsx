/**
 * Stackra file contract:
 * Purpose: the native `TreeSelect`: a labelled field whose options are a tree. Its trigger, in HeroUI Native's field
 *          colours and radius, shows the chosen rows' names (or "3 chosen") and opens a bottom sheet holding a
 *          TreeView; `single` closes on a choice, `multiple` ticks rows (a tick carries down to
 *          the rows under it unless `isSelectionPropagated` is false) and closes from "Done". Rows can load lazily
 *          through `onLoadChildren`.
 * Boundary: the trigger is a button read by the field's name with the chosen names as its value; the sheet is the
 *           house Drawer. A native field has no form to submit under `name`. Rows lay out from the start edge, so the
 *           field mirrors in right-to-left.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (one field contract); ADR 0060 (right-to-left); STA-1371 (wave
 *          C, owner request 2026-10-29).
 */
import { Description, FieldError, Label, TextField as HeroTextField } from "heroui-native";
import { useState, type ReactElement } from "react";
import { Pressable, View } from "react-native";

import type { TreeViewNode } from "#contracts/types/tree-view-node.type";
import { FIELD_RADIUS_CLASS_NAME } from "#core/constants/field-radius-class-name.constant";
import { INPUT_KEYS } from "#core/constants/input-keys.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { listFormatOf } from "#core/functions/list-format-of.function";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { Drawer } from "#native/drawer/drawer";
import { useNumberFormat } from "#native/hooks/use-number-format";
import { Icon } from "#native/icon/icon";
import { Text } from "#native/text/text";
import type { TreeSelectProps } from "#native/tree-select/tree-select.props";
import { TreeView } from "#native/tree-view/tree-view";
import { useUiText } from "#react/hooks/use-ui-text";

/** Nothing chosen yet. */
const NONE: readonly string[] = [];

/** The names of the rows, by id, through the whole tree. */
const namesOf = (nodes: readonly TreeViewNode[], into = new Map<string, string>()) => {
  for (const node of nodes) {
    into.set(node.id, node.label);
    namesOf(node.children ?? [], into);
  }
  return into;
};

/** A field that picks one row or several from a tree in a sheet. */
export function TreeSelect({
  items,
  label,
  description,
  errorMessage,
  isInvalid,
  isDisabled,
  isRequired,
  isReadOnly,
  placeholder,
  selectionMode = "single",
  isSelectionPropagated = true,
  defaultExpandedKeys,
  onLoadChildren,
  value,
  defaultValue,
  onChange,
  name: _name,
  className,
  accessibilityLabel,
}: TreeSelectProps): ReactElement {
  const t = useUiText();
  const format = useNumberFormat();
  const { locale } = useDesignSystem();
  const [own, setOwn] = useState(defaultValue ?? NONE);
  const [isOpen, setOpen] = useState(false);
  const chosen = value ?? own;
  const names = namesOf(items);
  const isLocked = Boolean(isDisabled || isReadOnly);
  const fieldName = accessibilityLabel ?? (typeof label === "string" ? label : "");
  const listed = listFormatOf(locale, { type: "unit", style: "short" }).format(
    chosen.map((key) => names.get(key) ?? key),
  );
  const shown =
    chosen.length === 0
      ? null
      : chosen.length <= 2
        ? listed
        : t(INPUT_KEYS.ui.tree_select.count, { count: format(chosen.length) });

  // The TreeView plays the selection haptic itself.
  const choose = (keys: readonly string[]) => {
    if (value === undefined) setOwn(keys);
    onChange?.(keys);
    if (selectionMode === "single" && keys.length > 0) setOpen(false);
  };

  return (
    <HeroTextField {...omitUndefined({ isRequired, isInvalid, isDisabled, className })}>
      {label == null ? null : <Label>{label}</Label>}
      <Pressable
        disabled={Boolean(isDisabled)}
        onPress={() => (isLocked ? undefined : setOpen(true))}
        accessibilityRole="button"
        accessibilityLabel={fieldName}
        accessibilityValue={{ text: listed }}
        accessibilityState={{ disabled: Boolean(isDisabled), expanded: isOpen }}
        className={`min-h-12 flex-row items-center gap-2 border bg-field px-3 py-2 ${isInvalid ? "border-danger" : "border-field-border"} ${FIELD_RADIUS_CLASS_NAME} ${isDisabled ? "opacity-50" : ""}`}
      >
        <Text isTruncated tone={shown === null ? "muted" : "default"} className="flex-1">
          {shown ?? placeholder ?? t(INPUT_KEYS.ui.tree_select.placeholder)}
        </Text>
        <View>
          <Icon name="chevron-down" tone="muted" />
        </View>
      </Pressable>
      {description == null ? null : <Description hideOnInvalid>{description}</Description>}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
      <Drawer isOpen={isOpen && !isLocked} onOpenChange={setOpen} label={fieldName}>
        <Drawer.Header>
          <Drawer.Title>{label ?? fieldName}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <TreeView
            items={items}
            label={fieldName}
            selectionMode={selectionMode}
            isSelectionPropagated={isSelectionPropagated}
            selectedKeys={chosen}
            onSelectionChange={choose}
            {...omitUndefined({ defaultExpandedKeys, onLoadChildren })}
          />
        </Drawer.Body>
        <Drawer.Close label={t(UI_KEYS.ui.multi_select.close)} />
      </Drawer>
    </HeroTextField>
  );
}
